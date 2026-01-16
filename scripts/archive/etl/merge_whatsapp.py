#!/usr/bin/env python3
# Merge WhatsApp phones from unidades_telefones.csv into unidades_cnes_with_addresses.md
import csv
import re
import unicodedata
from collections import defaultdict

PHONES_CSV = 'uploads/processed/unidades_telefones.csv'
INPUT_MD = 'uploads/processed/unidades_cnes_with_addresses.md'
OUTPUT_MD = 'uploads/processed/unidades_cnes_with_whatsapp.md'


def normalize(s):
    if not s:
        return ''
    s = s.strip().lower()
    # remove accents
    s = ''.join(ch for ch in unicodedata.normalize('NFD', s) if unicodedata.category(ch) != 'Mn')
    # remove punctuation
    s = re.sub(r"[^a-z0-9\s]", ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def tokenize(s):
    s = normalize(s)
    tokens = [t for t in s.split() if len(t) > 2]
    return tokens


def load_phones():
    phones = []
    with open(PHONES_CSV, encoding='utf-8', errors='ignore') as f:
        rdr = csv.reader(f)
        header = next(rdr, None)
        for row in rdr:
            if not row: continue
            name = row[0].strip()
            phone = row[1].strip() if len(row) > 1 else ''
            if not name or not phone: continue
            # handle entries that list multiple units with ' e ' or ',' or '/' or ' and '
            parts = re.split(r'\s+e\s+|\s*,\s*|/|\s+and\s+', name, flags=re.I)
            parts = [p.strip() for p in parts if p.strip()]
            if len(parts) > 1:
                for p in parts:
                    phones.append((p, phone))
            else:
                phones.append((name, phone))
    # normalize
    phone_map = []
    for name, phone in phones:
        phone_map.append({'raw': name, 'norm': normalize(name), 'tokens': set(tokenize(name)), 'phone': phone})
    return phone_map


def best_match(name, phone_map):
    name_norm = normalize(name)
    name_tokens = set(tokenize(name))
    if not name_tokens:
        return None
    best = None
    best_score = 0.0
    for entry in phone_map:
        if not entry['tokens']:
            continue
        overlap = len(name_tokens & entry['tokens'])
        # score: overlap / max(len(entry tokens), len(name tokens))
        denom = max(len(entry['tokens']), len(name_tokens))
        score = overlap / denom
        # also prefer exact substring matches
        if entry['norm'] in name_norm or name_norm in entry['norm']:
            score += 0.2
        if score > best_score:
            best_score = score
            best = entry
    if best_score >= 0.4:  # threshold
        return best
    return None


def main():
    phone_map = load_phones()
    md = open(INPUT_MD, encoding='utf-8', errors='ignore').read()
    lines = md.splitlines()
    out = []
    i = 0
    inserted = 0
    for line in lines:
        out.append(line)
        m = re.match(r"\s*-\s*CNES:\s*(\d{7})\s+NOME:\s*(.+)", line)
        if m:
            code = m.group(1)
            name = m.group(2).strip()
            # look if WHATSAPP already present in following lines
            # peek next two lines
            next_lines = '\n'.join(lines[i+1:i+6])
            if re.search(r'WHATSAPP:', next_lines, re.I):
                i += 1
                continue
            # try to match
            match = best_match(name, phone_map)
            if match:
                out.append('  WHATSAPP: ' + match['phone'])
                inserted += 1
        i += 1
    out_text = '\n'.join(out) + '\n'
    with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
        f.write(out_text)
    print(f'Inserted {inserted} WHATSAPP lines into {OUTPUT_MD}')

if __name__ == '__main__':
    main()
