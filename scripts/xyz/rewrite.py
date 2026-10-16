#!/usr/bin/env python3
"""Turn the GitHub Pages build (served under /mapthewild/) into the mapthewild.xyz build (served at the top level).

Usage: python3 scripts/xyz/rewrite.py dist dist-xyz
Copies dist to dist-xyz, then in every text file:
  https://mapthewild.github.io/mapthewild/...  ->  https://mapthewild.xyz/...
  /mapthewild/...                               ->  /...
"""
import os, re, shutil, sys

src, out = sys.argv[1], sys.argv[2]
if os.path.isdir(out):
    shutil.rmtree(out)
shutil.copytree(src, out)

TEXT = {'.html', '.js', '.mjs', '.css', '.json', '.xml', '.webmanifest', '.txt', '.svg', '.map'}
files = rewrites = 0
for root, _, names in os.walk(out):
    for name in names:
        if os.path.splitext(name)[1].lower() not in TEXT:
            continue
        path = os.path.join(root, name)
        with open(path, encoding='utf-8', errors='surrogateescape') as f:
            text = f.read()
        new = (text.replace('https://mapthewild.github.io/mapthewild/', 'https://mapthewild.xyz/')
                   .replace('https://mapthewild.github.io/mapthewild', 'https://mapthewild.xyz')
                   .replace('<link>https://mapthewild.github.io/</link>', '<link>https://mapthewild.xyz/</link>'))
        new, count = re.subn(r'(?<![\w.])/mapthewild/', '/', new)
        if new != text:
            with open(path, 'w', encoding='utf-8', errors='surrogateescape') as f:
                f.write(new)
            files += 1
            rewrites += count

left = []
for root, _, names in os.walk(out):
    for name in names:
        if os.path.splitext(name)[1].lower() in TEXT:
            with open(os.path.join(root, name), encoding='utf-8', errors='ignore') as f:
                if re.search(r'(?<![\w.])/mapthewild/', f.read()):
                    left.append(name)
print(f'rewrote {rewrites} links in {files} files')
if left:
    sys.exit(f'links left under /mapthewild/ in: {left[:5]}')
