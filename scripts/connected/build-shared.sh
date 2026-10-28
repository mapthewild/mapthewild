#!/bin/sh
# Build the mapthewild.xyz version of Map the Wild's main branch into a folder, for
# Nowbrary's and Future Dads' publish scripts: their Explore pages use its shared sea code.
# Builds from a clean copy, so files that were never committed are never published.
# Usage: scripts/connected/build-shared.sh <output folder>   (BRANCH=other-branch to try one)
set -e
OUT="$1"
[ -n "$OUT" ] || { echo "usage: $0 <output folder>"; exit 1; }
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
git clone -q --no-hardlinks -b "${BRANCH:-main}" "$REPO" "$WORK/site"
cd "$WORK/site"
git log -1 --format='shared sea from %h %s'
npm ci --silent
npx astro build >/dev/null
python3 scripts/xyz/rewrite.py dist "$OUT"
rm -rf "$WORK"
