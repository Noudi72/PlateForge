# PlateForge

Eishockey-Garderoben-Schilder (2000×550 px, Druck **200×55 mm**) — Editor, Team-Roster, Batch-Export.

## Nur eine `index.html` — reicht das?

**Ja, für GitHub Pages und viele Nutzer reicht das völlig aus.** Es ist eine statische Seite ohne Server-Logik: ideal für kostenloses Hosting, wenig Wartung, kein Build.

**Eine „richtige“ WebApp** (z. B. Vite + React/Vue, Router, API) lohnt sich eher, wenn ihr z. B. braucht:

- Nutzerkonten / gespeicherte Projekte in der Cloud  
- gemeinsame Bearbeitung, Backend, Datenbank  
- sehr großes Team, strikte Modultests, Design-System  
- mehrere Seiten/Routen mit geteiltem Layout  

Solange alles in einem Editor bleibt und lokal im Browser läuft, ist **ein statisches Repo** die schlankste Lösung.

### Optional ohne Framework

Wenn die Datei unübersichtlich wird, könnt ihr später **ohne** SPA nur splitten:

- `index.html` + `app.js` + `styles.css` — weiterhin **ohne Build**, gleiche GitHub-Pages-Story.

## GitHub Pages (eine Datei im Repo-Root)

1. Repo auf GitHub pushen (mit `index.html` im **Root** oder im Ordner **`docs/`**).
2. Repository → **Settings** → **Pages**  
   - *Source*: Branch **main** (oder *master*), Ordner **`/` (root)** oder **`/docs`**, je nachdem wo `index.html` liegt.
3. Nach dem Deploy erscheint die URL unter **Settings → Pages** (z. B. `https://<user>.github.io/<repo>/`).

Kein Node, kein `npm run build` nötig.

### Alternative: GitHub Actions

Nur sinnvoll, wenn ihr später einen Build habt (z. B. Vite). Für die aktuelle Single-HTML-Version ist der Branch-/docs-Weg einfacher.

---

### Eigene Vorlagen

Unter **Design → Eigene Vorlagen** das aktuelle Layout speichern (Farben, Schrift, Badge, Positionen, Grössen, …). Die Daten liegen im **localStorage** des Browsers (pro Gerät/Domain). Optional Logo und Hintergrundbild mit speichern.

**Team-Sharing:** **📤 JSON** exportiert alle (oder ohne gespeicherte Liste: das aktuelle Design). **📥 Import** lädt eine `.json`-Datei (hinzufügen / gleiche Namen überschreiben). Pro Vorlage in der Liste: **↓** = einzeln exportieren.

**Hinweis Speicher:** Logo/Hintergrund als volle Data-URLs passen nicht in den Browser (`localStorage` ~5 MB). Logos werden als **PNG** (Transparenz) komprimiert, Hintergrundbilder als JPEG; wenn es trotzdem scheitert, wird ohne Bilder gespeichert – **JSON-Export** behält die volle Vorlage.

**Session:** Layout, Grössen und Positionen werden automatisch in `plateforge_session` gesichert (ohne Bilder). Das **Kader** bleibt in `plateforge_roster` erhalten – kein erneutes CSV-Import nötig nach Reload.

### Badge & Grössen (Design)

Alle Grössen-Regler sind unter **Design → Badge & Grössen** gebündelt: Badge-Form/-Farbe/-%, Nummer, Name, Logo 1/2, Rahmen, Deckkraft.

### Zwei Logos & Hilfslinien

- **Club-Logo 1 / 2** – separates Upload, Grösse unter Design → Badge & Grössen, Drag & Ecke zum Skalieren  
- **Hilfslinien** – Mitte, Drittel, Rand (Optionen → Sichtbarkeit); beim Ziehen rasten Elemente ein  
- **Druckrand (3 mm)** – roter Rahmen = Sicherheitszone (berechnet für 200×55 mm Schild); Inhalte werden beim Verschieben darin gehalten, Kanten rasten ein  
- **Logo-Bereich (Seitenstreifen)** – dunkler Streifen links/rechts; unter Optionen abschaltbar, falls Logos „auf Schwarz“ wirken

### Nummern-Badge

- **Nummer (Schrift)**: Grösse der Ziffer im Badge  
- **Badge-Grösse**: Skalierung der Form (25–160 %, Standard 72 %)  
- Nummern werden **ohne `#`** auf dem Schild angezeigt
