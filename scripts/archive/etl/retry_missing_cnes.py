#!/usr/bin/env python3
# Retry fetching detail pages for the CNES that were missing previously.
import time
import csv
import re
from urllib.parse import urljoin

BASE = 'http://cnes2.datasus.gov.br/'
OUT_CSV = 'uploads/processed/unidades_cnes_updates.csv'
OUT_MD = 'uploads/processed/unidades_cnes_with_addresses.md'
UNIDADES_MD = 'uploads/processed/unidades_cnes.md'

MISSING = ['2558726','5428343','5457882','5462258']

try:
    import requests
except Exception:
    requests = None
    import urllib.request as _ur


def fetch_url(url, timeout=20):
    last_exc = None
    for attempt in range(2):
        try:
            if requests:
                r = requests.get(url, timeout=timeout)
                r.encoding = 'latin-1' if r.encoding is None else r.encoding
                return r.text
            else:
                with _ur.urlopen(url, timeout=timeout) as r:
                    raw = r.read()
                    try:
                        return raw.decode('latin-1')
                    except Exception:
                        return raw.decode('utf-8', errors='ignore')
        except Exception as e:
            last_exc = e
            time.sleep(1)
    raise last_exc


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()


def extract_after_label(html, label):
    pat = re.compile(r'<b>\s*' + re.escape(label) + r':\s*</b>.*?</tr>\s*<tr[^>]*>(.*?)</tr>', re.S | re.I)
    m = pat.search(html)
    if not m:
        return []
    tr = m.group(1)
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S | re.I)
    vals = [strip_tags(td).replace('\n', ' ').strip() for td in tds]
    return vals


def assemble_address(vals):
    parts = []
    for key in ('logradouro', 'numero', 'complemento', 'bairro'):
        v = vals.get(key)
        if v:
            parts.append(v)
    cep = vals.get('cep')
    if cep:
        parts.append('CEP ' + cep)
    municipio = vals.get('municipio')
    uf = vals.get('uf')
    if municipio:
        if uf:
            parts.append(f"{municipio} - {uf}")
        else:
            parts.append(municipio)
    return ', '.join(parts)


def parse_detail(html):
    vals = {}
    row1 = extract_after_label(html, 'Logradouro')
    if row1:
        vals['logradouro'] = row1[0] if len(row1) >= 1 else ''
        vals['numero'] = row1[1] if len(row1) >= 2 else ''
        vals['telefone'] = row1[-1] if len(row1) >= 3 else ''
    row2 = extract_after_label(html, 'Complemento')
    if row2:
        vals['complemento'] = row2[0] if len(row2) >= 1 else ''
        vals['bairro'] = row2[1] if len(row2) >= 2 else ''
        vals['cep'] = row2[2] if len(row2) >= 3 else ''
        vals['municipio'] = row2[3] if len(row2) >= 4 else ''
        vals['uf'] = row2[4] if len(row2) >= 5 else ''
    # fallback
    for label in ['Bairro', 'CEP', 'Município', 'UF', 'Telefone', 'Número', 'Complemento']:
        key = label.lower().replace('ç', 'c').replace('í', 'i')
        if key not in vals or not vals.get(key):
            r = extract_after_label(html, label)
            if r:
                vals[key] = r[0] if len(r) >= 1 else ''
    return {k: (v or '').strip() for k, v in vals.items()}


def main():
    # read existing MD to map cnes->name
    md = open(UNIDADES_MD, encoding='utf-8', errors='ignore').read()
    md_map = {m.group(1): m.group(2).strip() for m in re.finditer(r'CNES:\s*(\d{7})\s+NOME:\s*(.+)', md)}

    appended = []
    failed = []

    # check existing CSV codes to avoid duplicates
    existing = set()
    try:
        with open(OUT_CSV, encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i == 0: continue
                parts = line.strip().split(',')
                if parts:
                    existing.add(parts[0])
    except FileNotFoundError:
        pass

    with open(OUT_CSV, 'a', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        # if file empty, write header (but above we appended, so assume header exists)
        for cnes7 in MISSING:
            if cnes7 in existing:
                print(f'{cnes7} already in CSV; skipping')
                continue
            vco = '500320' + cnes7
            url = urljoin(BASE, 'Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=' + vco)
            try:
                html = fetch_url(url, timeout=20)
            except Exception as e:
                print(f'Failed {cnes7}: {e}')
                failed.append((cnes7, str(e)))
                continue
            vals = parse_detail(html)
            endereco = assemble_address(vals)
            telefone = vals.get('telefone','')
            name = md_map.get(cnes7,'')
            w.writerow([cnes7, name, endereco, url, telefone])
            appended.append(cnes7)
            time.sleep(0.8)

    # update MD with appended addresses
    if appended:
        md_with = open(OUT_MD, encoding='utf-8', errors='ignore').read()
        lines = md_with.splitlines()
        out_lines = []
        for line in lines:
            out_lines.append(line)
            m = re.match(r'\s*-\s*CNES:\s*(\d{7})\s+NOME:\s*(.+)', line)
            if m:
                code = m.group(1)
                if code in appended:
                    # find the CSV row for this code
                    # simplistic: reopen CSV and find
                    with open(OUT_CSV, encoding='utf-8') as f:
                        for r in csv.reader(f):
                            if r and r[0] == code:
                                endereco = r[2]
                                telefone = r[4] if len(r) > 4 else ''
                                if endereco:
                                    out_lines.append('  ENDERECO: ' + endereco)
                                if telefone:
                                    out_lines.append('  TELEFONE: ' + telefone)
                                break
        open(OUT_MD, 'w', encoding='utf-8').write('\n'.join(out_lines) + '\n')

    print('Appended:', appended)
    print('Failed:', failed)

if __name__ == '__main__':
    main()
