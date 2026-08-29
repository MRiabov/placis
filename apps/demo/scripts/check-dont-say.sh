#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
demo="$(cd "$here/.." && pwd)"

root="$demo"
while [[ "$root" != "/" ]]; do
  if [[ -d "$root/cmd/ci/check-dont-say" && -f "$root/docs/glossary.md" ]]; then
    cd "$root"
    exec go run ./cmd/ci/check-dont-say --all --glossary docs/glossary.md --roots apps/demo
  fi
  root="$(cd "$root/.." && pwd)"
done

if [[ -d "$demo/ci/check-dont-say" && -f "$demo/glossary.md" ]]; then
  cd "$demo"
  exec go run ./ci/check-dont-say --all --glossary glossary.md --roots src
fi

echo "check-dont-say: glossary and checker not found" >&2
exit 1
