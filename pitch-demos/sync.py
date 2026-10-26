"""Copy _shared/ into every site so each folder deploys on its own, and build img/credits.js from credits.json.

Run after editing anything in _shared/:  python pitch-demos/sync.py
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITES = ['eatery', 'restaurant', 'store', 'clinic']

for site in SITES:
    d = ROOT / site
    if not d.exists():
        continue
    dest = d / 'shared'
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(ROOT / '_shared', dest)
    cj = d / 'img' / 'credits.json'
    if cj.exists():
        credits = json.loads(cj.read_text())
        (d / 'img' / 'credits.js').write_text('window.PHOTO_CREDITS = ' + json.dumps(credits, ensure_ascii=False) + ';\n', encoding='utf-8')
    print('synced', site)
