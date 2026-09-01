#!/usr/bin/env bash
# Run rumdl against tracked Markdown only (not untracked working-tree files).
# Pre-commit always-run hooks use this so rebase leftovers fail locally the
# same way CI does. .agents/ is imported skills; testdata is Don't-say fixtures.
set -euo pipefail

git ls-files -z -- '*.md' \
  | grep -z -v '^\.agents/' \
  | grep -z -v '/testdata/' \
  | xargs -0 -r rumdl "$@"
