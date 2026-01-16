"""Parseia uploads/processed/profissionais_text.txt e gera uploads/processed/profissionais_parsed.csv
Formato de saída: cnes,unidade,cpf,cns,nome,cbo_code,cbo_text
"""
import re
from pathlib import Path
import csv

ROOT = Path(__file__).resolve().parents[1]
TXT = ROOT / 'uploads' / 'processed' / 'profissionais_text.txt'
OUT = ROOT / 'uploads' / 'processed' / 'profissionais_parsed.csv'

text = TXT.read_text(encoding='utf-8')
# Normalize line endings
lines = text.splitlines()

units = []
current = None
buffer = []

cnes_re = re.compile(r'^CNES\s*:\s*(\d+)\s*-\s*(.+)$')
# pattern to detect end of a professional record: CBO code like 5-6 digits followed by ' - ' and text
cbo_end_re = re.compile(r'(\d{5,6})\s*-\s*(.+)$')

for ln in lines:
    ln = ln.rstrip()
    m = cnes_re.search(ln)
    if m:
        # flush previous unit
        if current:
            units.append((current, buffer))
        current = (m.group(1).strip(), m.group(2).strip())
        buffer = []
        continue
    # If line indicates total or page header, skip
    if ln.startswith('Total de Profissionais') or ln.startswith('MS / SAS') or ln.startswith('DATASUS') or ln.startswith('---- PAGE'):
        continue
    # skip empty
    if not ln.strip():
        continue
    buffer.append(ln)

# flush last
if current:
    units.append((current, buffer))

rows = []
for (cnes, unidade), buf in units:
    # join buffer lines with space to simplify wrapped names
    # but preserve boundaries by splitting logical records using CBO pattern
    joined = ' \n'.join(buf)
    # find all occurrences where a record ends with CBO pattern
    # strategy: iterate over lines, accumulate until a CBO pattern is seen
    acc = ''
    for ln in buf:
        if acc:
            acc += ' ' + ln
        else:
            acc = ln
        m = cbo_end_re.search(acc)
        if m:
            # extract cpf, cns, name, cbo code, cbo text
            # cpf: starts with digits (may be 11), then spaces then cns (digits), then name (middle)
            # Try regex
            rec_re = re.compile(r'^(\d{11})\s+(\d+)\s+(.+?)\s+(\d{5,6})\s*-\s*(.+)$')
            rm = rec_re.search(acc)
            if rm:
                cpf = rm.group(1).strip()
                cns = rm.group(2).strip()
                nome = rm.group(3).strip()
                cbo_code = rm.group(4).strip()
                cbo_text = rm.group(5).strip()
                rows.append([cnes, unidade, cpf, cns, nome, cbo_code, cbo_text])
            else:
                # fallback: try to split by spaces
                parts = acc.split()
                if len(parts) >= 4:
                    cpf = parts[0]
                    cns = parts[1]
                    # find cbo_code at end
                    m2 = cbo_end_re.search(acc)
                    if m2:
                        cbo_code = m2.group(1).strip()
                        cbo_text = m2.group(2).strip()
                        # name is between cns and cbo_code
                        name_part = acc
                        # remove cpf and cns from start
                        name_part = re.sub(r'^\d+\s+\d+\s+', '', name_part)
                        # remove cbo part
                        name_part = re.sub(r'\s+%s\s*-\s*%s$' % (re.escape(cbo_code), re.escape(cbo_text)), '', name_part)
                        nome = name_part.strip()
                        rows.append([cnes, unidade, cpf, cns, nome, cbo_code, cbo_text])
                    else:
                        # couldn't parse
                        pass
            acc = ''
        else:
            # wait for more lines
            pass

# write CSV
OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open('w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    w.writerow(['cnes','unidade','cpf','cns','nome','cbo_code','cbo_text'])
    for r in rows:
        w.writerow(r)

print('Parsed rows:', len(rows))
print('Wrote', OUT)
