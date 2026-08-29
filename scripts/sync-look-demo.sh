#!/usr/bin/env bash
# Copy the look app, glossary, and Don't-say checker to the designer checkout.
# Usage: scripts/sync-look-demo.sh [destination]
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
dest="${1:-$repo/../demo.placis.com}"
dest="$(cd "$dest" && pwd)"

if [[ ! -d "$dest" ]]; then
  echo "destination does not exist: $dest" >&2
  exit 1
fi

rsync -a --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  "$repo/demo/" "$dest/"

cp "$repo/docs/glossary.md" "$dest/glossary.md"
mkdir -p "$dest/ci/check-dont-say"
rsync -a --delete \
  --exclude '*_test.go' \
  --exclude testdata \
  --exclude ref.md \
  "$repo/cmd/ci/check-dont-say/" "$dest/ci/check-dont-say/"

if [[ ! -f "$dest/go.mod" ]]; then
  cat > "$dest/go.mod" <<'EOF'
module demo.placis.com

go 1.25.0
EOF
fi

echo "synced look app -> $dest"
echo "copy-back: rsync the app the other way, then cp glossary.md to docs/glossary.md"
