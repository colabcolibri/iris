#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npx --yes esbuild@0.25.0 js/app.js \
  --bundle \
  --format=iife \
  --outfile=js/app.bundle.js \
  --platform=browser

echo "Wrote js/app.bundle.js"
