#!/usr/bin/env bash
# Copy the look app, glossary, and Don't-say checker to the designer checkout.
# Does not touch dest/docs/ (product package from export_designer_docs.py).
# Usage: scripts/sync-look-demo.sh [destination]
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "$repo" == *"/.worktrees/"* ]]; then
  main_checkout="${repo%%/.worktrees/*}"
  default_dest="$main_checkout/../demo.placis.com"
else
  default_dest="$repo/../demo.placis.com"
fi
dest="${1:-$default_dest}"
if [[ ! -d "$dest" ]]; then
  echo "destination does not exist: $dest" >&2
  exit 1
fi
dest="$(cd "$dest" && pwd)"
if [[ ! -e "$dest/.git" ]]; then
  echo "destination is not a git repo: $dest" >&2
  exit 1
fi

rsync -a --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude docs \
  --exclude SANITIZATION.md \
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
