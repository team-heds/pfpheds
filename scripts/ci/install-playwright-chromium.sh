#!/usr/bin/env bash
# Installe le Chromium de Playwright utilisé pour exporter les présentations en PDF.
#
# Les dépendances système (apt) ne sont installées que s'il en manque réellement : les
# machines GitHub les ont déjà, et une panne des dépôts Ubuntu ne doit pas bloquer la CI.
set -euo pipefail

npm exec --prefix presentation -- playwright install chromium

cache_dir="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
missing=""
while IFS= read -r binary; do
  libs="$(ldd "$binary" 2>/dev/null | awk '/not found/ {print $1}' || true)"
  [[ -n "$libs" ]] && missing+="$libs"$'\n'
done < <(find "$cache_dir" -type f \( -name chrome -o -name chrome-headless-shell -o -name headless_shell \) 2>/dev/null)

if [[ -n "$missing" ]]; then
  echo "Bibliothèques système manquantes :"
  printf '%s' "$missing" | sort -u
  echo "Installation des dépendances système de Chromium (apt)."
  npm exec --prefix presentation -- playwright install-deps chromium
else
  echo "Dépendances système de Chromium déjà présentes : aucune installation apt."
fi
