"""Extrai tabelas de `uploads/profissionais_por_unidade_do_municipio.pdf` usando pdfplumber.
Gera CSVs em `uploads/processed/` e um relatório resumo `uploads/processed/profissionais_report.txt`.
"""
import os
import sys
from pathlib import Path

try:
    import pdfplumber
    import pandas as pd
except Exception as e:
    print("Missing required packages. Please install pdfplumber and pandas.")
    raise

ROOT = Path(__file__).resolve().parents[1]
IN_PDF = ROOT / 'uploads' / 'profissionais_por_unidade_do_municipio.pdf'
OUT_DIR = ROOT / 'uploads' / 'processed'
OUT_DIR.mkdir(parents=True, exist_ok=True)

report = {
    'input_pdf': str(IN_PDF),
    'exists': IN_PDF.exists(),
    'pages': 0,
    'pages_with_text': 0,
    'tables_found': 0,
    'tables_files': []
}

if not IN_PDF.exists():
    print(f'PDF not found: {IN_PDF}')
    sys.exit(2)

try:
    with pdfplumber.open(IN_PDF) as pdf:
        report['pages'] = len(pdf.pages)
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text and text.strip():
                report['pages_with_text'] += 1
            # extract_tables returns list of tables (each table is list of rows)
            tables = page.extract_tables()
            if not tables:
                # Sometimes table extraction fails; try to detect simple table via lines/rects (skip for now)
                continue
            for tidx, table in enumerate(tables, start=1):
                # Convert to DataFrame
                try:
                    df = pd.DataFrame(table)
                    # Remove fully empty columns
                    df = df.dropna(axis=1, how='all')
                    # If first row seems like header (no None), promote
                    header = None
                    if not df.empty:
                        first_row = df.iloc[0].tolist()
                        if all(cell and str(cell).strip() for cell in first_row):
                            header = [str(c).strip() for c in first_row]
                            df = df[1:]
                            df.columns = header
                    # fallback column names
                    if df.columns.isnull().any():
                        df.columns = [f'col_{c}' for c in range(len(df.columns))]
                    out_name = OUT_DIR / f'profissionais_p{i:03d}_t{tidx:02d}.csv'
                    df.to_csv(out_name, index=False)
                    report['tables_found'] += 1
                    report['tables_files'].append(str(out_name.relative_to(ROOT)))
                    print(f'Wrote table: {out_name}')
                except Exception as ex:
                    print(f'Failed to write table p{i} t{tidx}:', ex)

except Exception as e:
    print('Error processing PDF:', e)
    raise

# Write summary report
report_file = OUT_DIR / 'profissionais_report.txt'
with report_file.open('w', encoding='utf-8') as f:
    f.write(f"Input PDF: {report['input_pdf']}\n")
    f.write(f"Exists: {report['exists']}\n")
    f.write(f"Pages: {report['pages']}\n")
    f.write(f"Pages with text: {report['pages_with_text']}\n")
    f.write(f"Tables found: {report['tables_found']}\n")
    f.write("Tables files:\n")
    for p in report['tables_files']:
        f.write(f" - {p}\n")

print('\nSummary:')
print(f"Pages: {report['pages']}")
print(f"Pages with text: {report['pages_with_text']}")
print(f"Tables found: {report['tables_found']}")
print(f"Report written to: {report_file}")
