#!/usr/bin/env bash
#
# Generiert simulations.json aus allen simulations/*/meta.json Dateien.
# Wird automatisch per pre-commit Hook aufgerufen.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT="simulations.json"

# Alle meta.json Dateien einlesen, path-Feld aus dem Ordnernamen ableiten
# und zu einem JSON-Array zusammenfassen
echo '[' > "$OUTPUT.tmp"

first=true
for meta in simulations/*/meta.json; do
  [ -f "$meta" ] || continue
  dir=$(dirname "$meta")
  folder=$(basename "$dir")

  if [ "$first" = true ]; then
    first=false
  else
    printf ',\n' >> "$OUTPUT.tmp"
  fi

  jq --arg path "simulations/${folder}/index.html" '. + {path: $path}' "$meta" >> "$OUTPUT.tmp"
done

echo ']' >> "$OUTPUT.tmp"

# Nochmal durch jq fuer saubere Formatierung
jq '.' "$OUTPUT.tmp" > "$OUTPUT"
rm -f "$OUTPUT.tmp"

count=$(jq 'length' "$OUTPUT")
echo "simulations.json generiert ($count Simulationen)"
