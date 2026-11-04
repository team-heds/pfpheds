#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
candidate=${1:?Usage: build-public-test.sh /absolute/path/to/candidate}
output="$candidate/dist"

case "$candidate" in
  /tmp/*) ;;
  *) printf 'Candidate directory must be under /tmp: %s\n' "$candidate" >&2; exit 1 ;;
esac

test -f "$root/deploy/staging/frontend.env"
test ! -e "$output"
mkdir -p "$candidate"

set -a
# frontend.env fournit uniquement la clé anonyme de la stack de test. Les URL
# locales qu'il contient sont volontairement remplacées pour le domaine public.
. "$root/deploy/staging/frontend.env"
set +a

export VITE_SUPABASE_URL='https://test.hedsvs.ch'
export VITE_API_URL='https://test.hedsvs.ch/api'
export VITE_API_BASE_URL='https://test.hedsvs.ch/api'
export VITE_BACKEND_URL='https://test.hedsvs.ch'
export VITE_APP_ENV='test'

cd "$root"
npx vite build --outDir "$output"

test -f "$output/index.html"
test -f "$output/sw.js"

if grep -RIl --include='*.js' 'http://localhost:8180' "$output/assets" | grep -q .; then
  printf 'Unsafe public test build: localhost:8180 is embedded in assets.\n' >&2
  exit 1
fi

if ! grep -RIl --include='*.js' 'https://test.hedsvs.ch' "$output/assets" | grep -q .; then
  printf 'Invalid public test build: test.hedsvs.ch is absent from assets.\n' >&2
  exit 1
fi

printf 'TARGET=test.hedsvs.ch\nLOCALHOST_EMBEDDED=false\nPRODUCTION_TOUCHED=false\n'
