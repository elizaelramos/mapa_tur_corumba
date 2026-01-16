#!/usr/bin/env python3
"""
Gera CSV final de unidades mesclando endereços e WhatsApp
"""
import csv
import re

CSV_IN = 'uploads/processed/unidades_cnes_updates.csv'
MD_IN = 'uploads/processed/unidades_cnes_with_whatsapp.md'
CSV_OUT = 'uploads/processed/unidades_cnes_final.csv'

def main():
    # Carregar WhatsApp do MD
    whatsapp_map = {}
    with open(MD_IN, encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            m = re.match(r'\s*-\s*CNES:\s*(\d{7})\s+NOME:', line)
            if m:
                cnes = m.group(1)
                # Buscar WHATSAPP: nas próximas linhas
                for j in range(1, 6):
                    if i+j < len(lines) and 'WHATSAPP:' in lines[i+j]:
                        whatsapp_map[cnes] = lines[i+j].split('WHATSAPP:')[1].strip()
                        break
    
    # Carregar CSV e mesclar
    rows = []
    with open(CSV_IN, encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cnes = row['cnes'].strip()
            row['whatsapp'] = whatsapp_map.get(cnes, '')
            rows.append(row)
    
    # Escrever CSV final
    fieldnames = ['cnes', 'nome', 'endereco', 'telefone', 'whatsapp', 'detail_url']
    with open(CSV_OUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, '') for k in fieldnames})
    
    print(f'✓ Gerado {CSV_OUT} com {len(rows)} unidades')
    
    # Validações
    cnes_seen = set()
    dups = []
    for row in rows:
        c = row['cnes']
        if c in cnes_seen:
            dups.append(c)
        cnes_seen.add(c)
    
    if dups:
        print(f'⚠ WARNING: {len(dups)} CNES duplicados: {dups[:10]}')
    else:
        print('✓ Sem CNES duplicados')
    
    # Verificar campos
    missing_endereco = sum(1 for r in rows if not r.get('endereco','').strip())
    missing_nome = sum(1 for r in rows if not r.get('nome','').strip())
    has_whatsapp = sum(1 for r in rows if r.get('whatsapp','').strip())
    
    print(f'✓ Endereços preenchidos: {len(rows) - missing_endereco}/{len(rows)}')
    print(f'✓ Nomes preenchidos: {len(rows) - missing_nome}/{len(rows)}')
    print(f'✓ WhatsApp preenchidos: {has_whatsapp}/{len(rows)}')

if __name__ == '__main__':
    main()
