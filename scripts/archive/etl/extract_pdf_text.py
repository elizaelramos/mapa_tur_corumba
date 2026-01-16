"""Extrai texto do PDF página a página e salva em uploads/processed/profissionais_text.txt"""
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
IN_PDF = ROOT / 'uploads' / 'profissionais_por_unidade_do_municipio.pdf'
OUT = ROOT / 'uploads' / 'processed' / 'profissionais_text.txt'
OUT.parent.mkdir(parents=True, exist_ok=True)

with pdfplumber.open(IN_PDF) as pdf:
    with OUT.open('w', encoding='utf-8') as f:
        for i, page in enumerate(pdf.pages, start=1):
            f.write(f'---- PAGE {i} ----\n')
            txt = page.extract_text()
            if txt:
                f.write(txt)
            else:
                f.write('[NO TEXT]\n')
            f.write('\n\n')

print('Wrote', OUT)
