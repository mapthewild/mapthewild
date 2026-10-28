#!/bin/sh
# Publish what's on GitHub's main branch to mapthewild.xyz.
# Builds from a clean copy, so files that were never committed are never published.
# Needs Node 22 for wrangler, and the Cloudflare sign-in on this Mac.
# --no-upload builds and connects everything, then stops and says where the folder is.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
git clone -q --no-hardlinks "$REPO" "$WORK/site"
cd "$WORK/site"
git log -1 --format='publishing %h %s'
npm ci --silent
npx astro build
python3 scripts/xyz/rewrite.py dist dist-xyz
# Explore's crossings to nowbrary.com and futuredadsclub.com (scripts/connected/assemble.py).
python3 scripts/connected/assemble.py mapthewild dist-xyz dist-xyz
if [ "$1" = "--no-upload" ]; then echo "Not uploaded. The site is in $WORK/site/dist-xyz"; exit 0; fi
cd scripts/xyz
PATH="$HOME/.nvm/versions/node/v22.23.4/bin:$PATH" npx --yes wrangler@4 deploy
rm -rf "$WORK"
