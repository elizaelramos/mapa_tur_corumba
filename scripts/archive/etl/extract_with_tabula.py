"""Tenta extrair tabelas do PDF usando tabula-py (usa Java). Salva CSVs em uploads/processed/.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
IN_PDF = ROOT / 'uploads' / 'profissionais_por_unidade_do_municipio.pdf'
OUT_DIR = ROOT / 'uploads' / 'processed'
OUT_DIR.mkdir(parents=True, exist_ok=True)

if not IN_PDF.exists():
    print('Input PDF not found:', IN_PDF)
    sys.exit(2)

try:
    import tabula
    import pandas as pd
except Exception as e:
    print('tabula-py not installed. Please pip install tabula-py')
    raise

print('Trying tabula (lattice=True) on all pages...')
try:
    tables = tabula.read_pdf(str(IN_PDF), pages='all', multiple_tables=True, lattice=True)
    print(f'lattice found {len(tables)} tables')
except Exception as e:
    print('lattice failed:', e)
    tables = []

if not tables:
    print('Trying tabula (stream=True) on all pages...')
    try:
        tables = tabula.read_pdf(str(IN_PDF), pages='all', multiple_tables=True, stream=True)
        print(f'stream found {len(tables)} tables')
    except Exception as e:
        print('stream failed:', e)
        tables = []

if not tables:
    print('No tables extracted by tabula.')
    sys.exit(0)

for i, df in enumerate(tables, start=1):
    if isinstance(df, pd.DataFrame):
        out = OUT_DIR / f'tabula_table_{i:03d}.csv'
        df.to_csv(out, index=False)
        print('Wrote', out)

print('Done.')
