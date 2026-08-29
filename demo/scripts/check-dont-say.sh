#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
demo="$(cd "$here/.." && pwd)"

if [[ -d "$demo/../cmd/ci/check-dont-say" && -f "$demo/../docs/glossary.md" ]]; then
  repo="$(cd "$demo/.." && pwd)"
  cd "$repo"
  exec go run ./cmd/ci/check-dont-say --all --glossary docs/glossary.md --roots demo
fi

if [[ -d "$demo/ci/check-dont-say" && -f "$demo/glossary.md" ]]; then
  cd "$demo"
  exec go run ./ci/check-dont-say --all --glossary glossary.md --roots src
fi

echo "check-dont-say: glossary and checker not found" >&2
exit 1
