#!/usr/bin/env bash
# Installs the Vitrine brand fonts used by the onboarding-PDF generator:
#   Geist   (sans / body)        — the site's --font-geist-sans
#   DM Sans (labels / "mono")    — the site's --font-geist-mono
#   Gelasio (serif headings)     — an OFL, metric-compatible twin of Georgia,
#                                  which the site's `font-serif` resolves to.
#
# All three are SIL Open Font License. We download the variable TTFs from the
# google/fonts repo and instantiate the static weights/italics WeasyPrint needs,
# installing them into ~/.local/share/fonts/brand.
#
# Usage:  bash setup-fonts.sh   (then run build_onboarding_pdf.py)
set -euo pipefail

TMP="$(mktemp -d)"
DEST="${HOME}/.local/share/fonts/brand"
base="https://raw.githubusercontent.com/google/fonts/main/ofl"

echo "Downloading brand fonts…"
curl -sS -L -o "$TMP/Geist.ttf"          "$base/geist/Geist%5Bwght%5D.ttf"
curl -sS -L -o "$TMP/DMSans.ttf"         "$base/dmsans/DMSans%5Bopsz,wght%5D.ttf"
curl -sS -L -o "$TMP/DMSans-Italic.ttf"  "$base/dmsans/DMSans-Italic%5Bopsz,wght%5D.ttf"
curl -sS -L -o "$TMP/Gelasio.ttf"        "$base/gelasio/Gelasio%5Bwght%5D.ttf"
curl -sS -L -o "$TMP/Gelasio-Italic.ttf" "$base/gelasio/Gelasio-Italic%5Bwght%5D.ttf"

echo "Instantiating static weights…"
python3 - "$TMP" "$DEST" <<'PY'
import sys, os
from fontTools import ttLib
from fontTools.varLib import instancer
TMP, DEST = sys.argv[1], sys.argv[2]
os.makedirs(DEST, exist_ok=True)

def make(src, axes, out):
    f = ttLib.TTFont(os.path.join(TMP, src))
    instancer.instantiateVariableFont(f, axes, inplace=True, updateFontNames=True)
    f.save(os.path.join(DEST, out))

for w in (400, 500, 600, 700):
    make("Geist.ttf", {"wght": w}, f"Geist-{w}.ttf")
for w in (400, 500, 700):
    make("DMSans.ttf", {"wght": w, "opsz": 14}, f"DMSans-{w}.ttf")
for w in (400, 500):
    make("DMSans-Italic.ttf", {"wght": w, "opsz": 14}, f"DMSans-Italic-{w}.ttf")
for w in (400, 700):
    make("Gelasio.ttf", {"wght": w}, f"Gelasio-{w}.ttf")
    make("Gelasio-Italic.ttf", {"wght": w}, f"Gelasio-Italic-{w}.ttf")
print("installed to", DEST)
PY

fc-cache -f "$DEST" >/dev/null 2>&1 || true
rm -rf "$TMP"
echo "Done. Brand fonts available:"
fc-list | grep -iE "geist|dm sans|gelasio" | sort
