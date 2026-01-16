"""Limpa uploads/processed/profissionais_parsed.csv filtrando apenas registros válidos (CPF 11 dígitos).
Gera profissionais_parsed_clean.csv e um resumo por unidade (counts)."""
import re
from pathlib import Path
import csv
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
IN = ROOT / 'uploads' / 'processed' / 'profissionais_parsed.csv'
OUT = ROOT / 'uploads' / 'processed' / 'profissionais_parsed_clean.csv'
SUMMARY = ROOT / 'uploads' / 'processed' / 'profissionais_summary.txt'

cpf_re = re.compile(r'^\d{11}$')
rows = []
with IN.open('r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        cpf = r.get('cpf','').strip()
        cns = r.get('cns','').strip()
        nome = r.get('nome','').strip()
        if cpf_re.match(cpf) and cns.isdigit() and nome:
            rows.append(r)

# write cleaned
with OUT.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['cnes','unidade','cpf','cns','nome','cbo_code','cbo_text'])
    writer.writeheader()
    for r in rows:
        writer.writerow(r)

# summary per unidade and per cbo
unit_counter = Counter()
cbo_counter = Counter()
for r in rows:
    unit_counter[r['unidade']] += 1
    cbo_counter[r['cbo_text']] += 1

with SUMMARY.open('w', encoding='utf-8') as f:
    f.write(f'Total valid professionals: {len(rows)}\n\n')
    f.write('Top units by count:\n')
    for u,c in unit_counter.most_common():
        f.write(f'{c:4d}  {u}\n')
    f.write('\nTop CBOs:\n')
    for cbo,c in cbo_counter.most_common(30):
        f.write(f'{c:4d}  {cbo}\n')

print('Valid rows:', len(rows))
print('Wrote', OUT)
print('Wrote summary to', SUMMARY)
