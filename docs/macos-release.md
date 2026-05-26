# macOS Release

PlateForge kann lokal als Debug-DMG gebaut werden. Für eine DMG, die auf anderen Macs ohne Gatekeeper-Warnungen verteilt werden soll, brauchst du zusätzlich einen Apple Developer Account, ein `Developer ID Application` Zertifikat und Notarisierungsdaten.

## Lokaler Debug-Build

```bash
npm run tauri:build:debug
```

Ergebnis:

- `src-tauri/target/debug/bundle/macos/PlateForge.app`
- `src-tauri/target/debug/bundle/dmg/PlateForge_0.1.0_aarch64.dmg`

## Signierte Release-DMG

1. Apple Developer Zertifikat in der Schlüsselbundverwaltung installieren.
2. Signing Identity prüfen:

```bash
security find-identity -v -p codesigning
```

3. `.env.macos-release.example` nach `.env.macos-release` kopieren und ausfüllen.
4. Release-Umgebung laden und DMG bauen:

```bash
set -a
source .env.macos-release
set +a
npm run tauri:release
```

Tauri nutzt dabei `APPLE_SIGNING_IDENTITY` für die Signatur. Für die Notarisierung kannst du entweder `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` oder die App-Store-Connect-API-Variablen setzen.

## Prüfung

```bash
npm run macos:verify -- src-tauri/target/release/bundle/macos/PlateForge.app
```

Die Signatur muss gültig sein. Gatekeeper und Stapler melden erst dann sauber `accepted` bzw. ein gültiges Ticket, wenn der Release-Build erfolgreich notariert und gestapled wurde.

Referenz: https://v2.tauri.app/distribute/sign/macos/
