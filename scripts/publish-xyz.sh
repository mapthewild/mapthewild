#!/bin/sh
# Publish what's on GitHub's main branch to mapthewild.xyz.
# Builds from a clean copy, so files that were never committed are never published.
# Needs Node 22 for wrangler, and the Cloudflare sign-in on this Mac.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
git clone -q "$REPO" "$WORK/site"
cd "$WORK/site"
git log -1 --format='publishing %h %s'
npm ci --silent
npx astro build
python3 scripts/xyz/rewrite.py dist dist-xyz
cd scripts/xyz
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" npx --yes wrangler@4 deploy
rm -rf "$WORK"
