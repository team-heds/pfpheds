#!/usr/bin/env bash
# macOS/Linux entry point. No changes on the VPS without --deploy.
set -euo pipefail
cd "$(dirname "$0")"
exec node scripts/deployment/deploy.mjs "$@"
