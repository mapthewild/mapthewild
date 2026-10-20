#!/usr/bin/env python3
"""Make the GitHub Pages copy forward to mapthewild.xyz.

Usage: python3 scripts/xyz/forward-pages.py dist
Every HTML page in dist becomes a small page that sends the reader to the same
page on https://mapthewild.xyz. Pictures, PDFs and other files are left as they are,
so anything embedded elsewhere keeps working.
"""
import html, os, sys

dist = sys.argv[1]
count = 0
for root, _, names in os.walk(dist):
    for name in names:
        if not name.endswith('.html'):
            continue
        rel = os.path.relpath(os.path.join(root, name), dist).replace(os.sep, '/')
        if rel == 'index.html':
            path = ''
        elif rel.endswith('/index.html'):
            path = rel[:-len('index.html')]
        else:
            path = rel
        url = html.escape('https://mapthewild.xyz/' + path, quote=True)
        page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Map the Wild has moved</title>
<link rel="canonical" href="{url}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={url}">
<script>location.replace({url!r} + location.search + location.hash)</script>
</head>
<body>
<p>Map the Wild has moved to <a href="{url}">{url}</a>.</p>
</body>
</html>
'''
        with open(os.path.join(root, name), 'w') as f:
            f.write(page)
        count += 1
print(f'{count} pages now forward to mapthewild.xyz')
