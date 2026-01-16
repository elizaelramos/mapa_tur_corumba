import csv
from collections import OrderedDict

input_path = r"uploads/processed/profissionais_parsed_clean.csv"
output_path = r"uploads/processed/unidades_cnes.md"

pairs = OrderedDict()
with open(input_path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cnes = row.get('cnes','').strip()
        unidade = row.get('unidade','').strip()
        if not cnes or not unidade:
            continue
        # Keep first occurrence; preserve original cnes string
        if cnes not in pairs:
            pairs[cnes] = unidade

# Sort by integer value of CNES when possible
try:
    sorted_items = sorted(pairs.items(), key=lambda x: int(x[0]))
except ValueError:
    sorted_items = sorted(pairs.items(), key=lambda x: x[0])

with open(output_path, 'w', encoding='utf-8', newline='') as out:
    out.write('# Lista de Unidades (CNES e NOME)\n\n')
    out.write('Este arquivo foi gerado a partir de `uploads/processed/profissionais_parsed_clean.csv`.\n\n')
    out.write('- Formato: `- CNES: <cnes>  NOME: <nome da unidade>`\n\n')
    for cnes, unidade in sorted_items:
        out.write(f'- CNES: {cnes}  NOME: {unidade}\n')

print(f'Wrote {len(sorted_items)} unique unidades to {output_path}')
