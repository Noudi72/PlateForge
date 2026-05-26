#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-src-tauri/target/release/bundle/macos/PlateForge.app}"

if [[ ! -d "$APP_PATH" ]]; then
  echo "App bundle not found: $APP_PATH" >&2
  exit 1
fi

echo "Verifying code signature..."
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

echo
echo "Signature details:"
codesign -dv --verbose=4 "$APP_PATH" 2>&1 | sed -n '/Authority=/p;/TeamIdentifier=/p;/Runtime Version=/p;/Identifier=/p'

echo
echo "Gatekeeper assessment:"
if spctl --assess --type execute --verbose=4 "$APP_PATH"; then
  echo "Gatekeeper: accepted"
else
  echo "Gatekeeper: not accepted yet. For distribution this usually means signing/notarization is missing or not stapled." >&2
fi

echo
echo "Stapler validation:"
if xcrun stapler validate "$APP_PATH"; then
  echo "Stapler: ticket valid"
else
  echo "Stapler: no valid notarization ticket found." >&2
fi
