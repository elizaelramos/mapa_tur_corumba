#!/usr/bin/env python3
# Fetch CNES detail pages from saved listing and extract address fields.
import re
import sys
from urllib.parse import urljoin

BASE = 'http://cnes2.datasus.gov.br/'
LISTING_FILE = 'uploads/processed/cnes_listing_raw.html'
UNIDADES_MD = 'uploads/processed/unidades_cnes.md'
OUT_CSV = 'uploads/processed/unidades_cnes_updates.csv'
OUT_MD = 'uploads/processed/unidades_cnes_with_addresses.md'

try:
    import requests
except Exception:
    requests = None
    import urllib.request as _ur


def read_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def write_file(path, txt):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(txt)


def fetch_url(url):
    if requests:
        r = requests.get(url, timeout=15)
        r.encoding = 'latin-1' if r.encoding is None else r.encoding
        return r.text
    else:
        with _ur.urlopen(url, timeout=15) as r:
            raw = r.read()
            try:
                return raw.decode('latin-1')
            except Exception:
                return raw.decode('utf-8', errors='ignore')


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s).strip()


def extract_after_label(html, label):
    # Find the label row <b>Label:</b> then capture the immediate next <tr>...</tr> containing values
    pat = re.compile(r'<b>\s*' + re.escape(label) + r':\s*</b>.*?</tr>\s*<tr[^>]*>(.*?)</tr>', re.S | re.I)
    m = pat.search(html)
    if not m:
        return []
    tr = m.group(1)
    # Find all td contents
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S | re.I)
    vals = [strip_tags(td).replace('\n', ' ').strip() for td in tds]
    return vals


def assemble_address(vals):
    # vals: dict of fields
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


def main():
    html = read_file(LISTING_FILE)
    # find all VCo_Unidade values
    vcos = re.findall(r'Exibe_Ficha_Estabelecimento\.asp\?VCo_Unidade=([0-9]+)', html)
    vcos = list(dict.fromkeys(vcos))
    if not vcos:
        print('No anchors found in listing file.', file=sys.stderr)
        return

    # load mapping from unidades_md
    md = read_file(UNIDADES_MD)
    md_map = {}
    for m in re.finditer(r'CNES:\s*(\d{7})\s+NOME:\s*(.+)', md):
        md_map[m.group(1)] = m.group(2).strip()

    out_rows = []
    missing = []

    for vco in vcos:
        detail_url = urljoin(BASE, 'Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=' + vco)
        try:
            s = fetch_url(detail_url)
        except Exception as e:
            print(f'Error fetching {detail_url}: {e}', file=sys.stderr)
            missing.append((vco, str(e)))
            continue
        # extract fields
        vals = {}
        # first label row contains Logradouro, Número, Telefone
        row1 = extract_after_label(s, 'Logradouro')
        if row1:
            # row1 might contain [logradouro, numero, telefone] or variations
            vals['logradouro'] = row1[0] if len(row1) >= 1 else ''
            vals['numero'] = row1[1] if len(row1) >= 2 else ''
            # telephone may be last column
            vals['telefone'] = row1[-1] if len(row1) >= 3 else ''
        # second block: Complemento, Bairro, CEP, Município, UF
        row2 = extract_after_label(s, 'Complemento')
        if row2:
            # Row order observed: complemento, bairro, cep, municipio (as an <a>), uf
            vals['complemento'] = row2[0] if len(row2) >= 1 else ''
            vals['bairro'] = row2[1] if len(row2) >= 2 else ''
            vals['cep'] = row2[2] if len(row2) >= 3 else ''
            # municipio might include extra text; keep it
            vals['municipio'] = row2[3] if len(row2) >= 4 else ''
            vals['uf'] = row2[4] if len(row2) >= 5 else ''
        # fallback searches for isolated labels
        for label in ['Bairro', 'CEP', 'Município', 'UF', 'Telefone', 'Número', 'Complemento']:
            key = label.lower().replace('ç', 'c').replace('í', 'i').replace('ã','a').replace('ó','o')
            if key not in vals or not vals.get(key):
                r = extract_after_label(s, label)
                if r:
                    vals[key] = r[0] if len(r) >= 1 else ''
        # normalize keys
        vals = {k: (v or '').strip() for k, v in vals.items()}
        cnes7 = vco[-7:]
        name = md_map.get(cnes7, '')
        endereco = assemble_address(vals)
        telefone = vals.get('telefone', '')
        out_rows.append((cnes7, name, endereco, detail_url, telefone))

    # write CSV
    import csv
    with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['cnes', 'nome', 'endereco', 'detail_url', 'telefone'])
        for row in out_rows:
            w.writerow(row)
    print('Wrote', len(out_rows), 'rows to', OUT_CSV)

    # create updated MD by appending ENDERECO to each CNES line
    lines = md.splitlines()
    new_lines = []
    for line in lines:
        new_lines.append(line)
        m = re.match(r'\s*-\s*CNES:\s*(\d{7})\s+NOME:\s*(.+)', line)
        if m:
            code = m.group(1)
            # find in out_rows
            match = next((r for r in out_rows if r[0] == code), None)
            if match and match[2]:
                new_lines.append(f'  ENDERECO: {match[2]}')
                if match[4]:
                    new_lines.append(f'  TELEFONE: {match[4]}')
    write_file(OUT_MD, '\n'.join(new_lines) + '\n')
    print('Wrote updated MD to', OUT_MD)

if __name__ == '__main__':
    main()
