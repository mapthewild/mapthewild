#!/usr/bin/env python3
"""Connect one of the three sites to the shared sea: Map the Wild, Nowbrary or Future Dads Club.

Each site's publish script runs this after its own build, so a routine publish keeps the
connections. Ported from Astra's tools/assemble.py (connected-sites-handoff-2026-10-27), with
one change, on Moe's choice of 28 Oct 2026: episode pages and the listening room keep playing
from the podcast host (Spotify); only the island radio plays Future Dads' own copies, because
its muffled, far-away sound can't process audio from another site.

Usage:
  python3 scripts/xyz/rewrite.py dist dist-xyz              # the mapthewild.xyz build
  python3 scripts/connected/assemble.py mapthewild dist-xyz dist-xyz
  python3 scripts/connected/assemble.py nowbrary dist-xyz ~/Documents/nowbrary-site/dist
  python3 scripts/connected/assemble.py future-dads dist-xyz ~/Documents/futuredads/site \\
      --radio-audio ~/Documents/futuredads/source/audio-web ~/Documents/futuredads/source/audio
Add --local to point the three sites at 127.0.0.1:4340-4342 instead of their real addresses
(--local-base 5340 for 5340-5342).
No network, credentials or publishing.
"""
import argparse, json, re, shutil
from pathlib import Path

SITES = {'mapthewild': ('mapthewild.xyz', 4340), 'nowbrary': ('nowbrary.com', 4341), 'future-dads': ('futuredadsclub.com', 4342)}
VISIT = 'world/connected/studies/journey-storyboard/future-dads-art/visit/'
LIMIT = 25 * 1024 * 1024  # Cloudflare's largest file

parser = argparse.ArgumentParser()
parser.add_argument('site', choices=SITES)
parser.add_argument('shared', type=Path, help='the mapthewild.xyz build (output of scripts/xyz/rewrite.py)')
parser.add_argument('root', type=Path, help="the site's own built folder, changed in place")
parser.add_argument('--radio-audio', type=Path, nargs='+', default=[], help='folders holding the radio recordings, first match wins')
parser.add_argument('--local', action='store_true')
parser.add_argument('--local-base', type=int, default=4340, help='first of the three local ports (Map the Wild, Nowbrary, Future Dads)')
args = parser.parse_args()
site, shared, root = args.site, args.shared.resolve(), args.root.resolve()
origin = {s: f'http://127.0.0.1:{args.local_base + i}' if args.local else f'https://{domain}' for i, (s, (domain, _)) in enumerate(SITES.items())}

def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)

# 1. The shared renderer and its pictures go with each destination, so it draws its own place.
if root != shared:
    for part in ['_astro', 'world', 'journey']:
        shutil.copytree(shared / part, root / part, dirs_exist_ok=True)
if site == 'nowbrary':
    write(root / 'explore/index.html', (shared / 'connected/nowbrary/index.html').read_text())
if site == 'future-dads':
    text = (root / VISIT / 'index.html').read_text()
    text = text.replace('<head>', f'<head><base href="/{VISIT}"><meta name="referrer" content="no-referrer">', 1)
    # Full-screen from the first paint, so the study's working panel never shows while the island loads.
    text = text.replace('<body>', '<body class="sea-visit owned-visit">', 1)
    # The study's link back to its storyboard becomes the site's own episode list.
    text = re.sub(r'<header><a href="[^"]*journey-storyboard[^"]*">[^<]*</a>', '<header><a href="/">Episodes</a>', text, count=1)
    write(root / 'explore/index.html', text)
    (root / VISIT / 'index.html').unlink()  # The study page itself is not part of the site.
    write(root / 'explore/room/index.html', (shared / 'connected/future-dads-room/index.html').read_text())
if (root / 'connected').exists():
    shutil.rmtree(root / 'connected')  # Intermediate pages; they now live on their own sites.

# 2. Recordings: only Future Dads serves them, and only for the radio.
for p in list((root / 'world/connected/studies').rglob('*')):
    if p.is_file() and p.suffix in {'.mp3', '.m4a'}:
        p.unlink()
for p in sorted((root / 'world/connected/studies').rglob('audio'), reverse=True):
    if p.is_dir() and not any(p.iterdir()):
        p.rmdir()
if site == 'future-dads':
    source = (root / VISIT / 'episodes.mjs').read_text()
    episodes = json.loads(source[source.index('['):].strip().rstrip(';'))
    for ep in episodes:
        target = (root / VISIT / ep['audio']).resolve()
        name, slug = Path(ep['audio']).name, re.sub(r'^\d+-', '', ep['slug'])
        found = None
        for folder in args.radio_audio:
            found = next((p for p in [folder / name, *sorted(folder.glob(f"{ep['date']}-{slug}.*"))] if p.is_file()), None)
            if found:
                break
        if not found:
            raise SystemExit(f"No recording for the radio's {ep['title']!r}: looked for {name} in {[str(f) for f in args.radio_audio]}")
        if found.stat().st_size > LIMIT:
            raise SystemExit(f'{found} is over 25 MiB; put a smaller copy with the same name in the first --radio-audio folder')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(found, target)
else:
    fd = origin['future-dads']
    write(root / VISIT / 'index.html', f'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={fd}/explore/"><a href="{fd}/explore/">Open Future Dads Club</a>')

# 3. The address book every site shares, and the "ready" answer the others check before crossing.
config = json.loads((shared / 'journey/config.json').read_text())
for s in SITES:
    config['sites'][s]['origin'] = origin[s]
write(root / 'journey/config.json', json.dumps(config, indent=2) + '\n')
write(root / 'journey/ready.json', json.dumps({'version': 1, 'site': site}) + '\n')

# 4. Explore on the site's own pages (not inside the renderer or the reading embeds).
for p in [root / 'explore/index.html', root / 'explore/room/index.html']:
    if p.exists() and '/journey/style.css' not in p.read_text():
        p.write_text(p.read_text().replace('</head>', '<link rel="stylesheet" href="/journey/style.css"></head>', 1))
READER = r'(<script[^>]+src="(?:\./)?reader\.js(?:\?[^"]*)?"[^>]*></script>)'
for p in root.rglob('*.html'):
    rel = p.relative_to(root).as_posix()
    if rel.startswith(('world/', 'explore/', 'journey/', '_astro/')):
        continue
    text = p.read_text()
    if 'journey/native.mjs' not in text:
        text = text.replace('</head>', '<meta name="referrer" content="no-referrer"><link rel="stylesheet" href="/journey/style.css"></head>', 1)
        text = text.replace('</body>', '<script type="module" src="/journey/native.mjs"></script></body>', 1)
    # Nowbrary's books remember their passage: the adapter runs before shelf.js.
    if site == 'nowbrary' and rel.startswith('reader/') and 'journey/reader-memory.js' not in text:
        text = re.sub(READER, r'\1<script src="/journey/reader-memory.js" defer></script>', text)
    p.write_text(text)
for p in (root / 'world/nowbrary/reader').glob('*.html'):  # the bookshop's copy of the reader
    text = p.read_text()
    if 'journey/reader-memory.js' not in text:
        p.write_text(re.sub(READER, r'\1<script src="/journey/reader-memory.js" defer></script>', text))
if site == 'nowbrary' and not (root / 'index.html').exists():
    write(root / 'index.html', '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/gallery.html#all"><a href="/gallery.html#all">Open Nowbrary</a>')

# 5. Headers: added to the site's own rules, never replacing them.
RULES = '/*\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n/journey/*\n  Cache-Control: no-cache\n/journey/ready.json\n  Access-Control-Allow-Origin: *\n/explore/*\n  Cache-Control: no-cache\n'
headers = root / '_headers'
existing = headers.read_text() if headers.exists() else ''
if '/journey/ready.json' not in existing:
    headers.write_text(existing + ('\n' if existing and not existing.endswith('\n') else '') + RULES)

files = [p for p in root.rglob('*') if p.is_file()]
big = [str(p.relative_to(root)) for p in files if p.stat().st_size > LIMIT]
print(f'{site}: connected {len(files)} files in {root}' + (f'; over 25 MiB: {big}' if big else ''))
if big:
    raise SystemExit(1)
