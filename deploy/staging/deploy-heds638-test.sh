#!/usr/bin/env bash
set -euo pipefail

candidate=${1:?Usage: deploy-heds638-test.sh /absolute/path/to/staging/build}
exec "$(dirname "$0")/deploy-heds635-test.sh" "$candidate" HEDS25-638
