#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT_DIR/vendor/GraphEngineering"
if [[ -d "$TARGET/.git" ]]; then
  git -C "$TARGET" pull --ff-only
else
  mkdir -p "$ROOT_DIR/vendor"
  git clone --depth 1 https://github.com/reacher-z/GraphEngineering.git "$TARGET"
fi
cd "$TARGET"
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
printf '\nGraphEngineering runtime built at:\n%s\n' "$TARGET/packages/runtime/dist/index.js"
printf 'Set GRAPH_ENGINEERING_MODE=native in .env to use it.\n'
