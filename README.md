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

Unter **Design → Eigene Vorlagen** das aktuelle Layout speichern (Farben, Schrift, Badge, Positionen, Grössen, …). Die Vorlagenliste bleibt im **localStorage** bewusst schlank; Logos und Hintergründe werden zusätzlich in **IndexedDB** und im JSON-Backup gesichert.

**Team-Sharing:** **📤 JSON** exportiert alle (oder ohne gespeicherte Liste: das aktuelle Design). **📥 Import** lädt eine `.json`-Datei (hinzufügen / gleiche Namen überschreiben). Pro Vorlage in der Liste: **↓** = einzeln exportieren.

**Export nach `Vorlagen json/`:** Beim ersten Export (oder über **📁**) den Projektordner `Vorlagen json` wählen — danach schreibt der Browser die Datei `plateforge_vorlagen_master.json` direkt dorthin (Chrome/Edge). Dieses Master-JSON enthält alle eigenen Vorlagen inklusive Bilder und kann auf einem anderen Gerät wieder importiert werden.

**Vorlagen neu laden:** Mit **🔄 Ordner** wird der verbundene Ordner `Vorlagen json` sofort neu eingelesen (Ordner wählen, nicht einzelne Datei). Mit **📥 Dateien** können eine oder mehrere `.json`-Dateien direkt ausgewählt werden. Zusätzlich werden im Repository vorhandene JSON-Vorlagen beim Start als Fallback importiert.

**Vorlagen löschen:** Eigene Vorlagen können in der Liste oder direkt über das **×** auf der Vorlagen-Kachel entfernt werden. Das Master-JSON wird danach aktualisiert.

**Hinweis Speicher:** `localStorage` ist auf ~5 MB begrenzt. Deshalb werden Bilddaten nicht mehr dauerhaft in der Vorlagenliste gehalten, sondern in IndexedDB/JSON ausgelagert — dadurch sind deutlich mehr Vorlagen möglich.

**Session:** Layout, Positionen und die zuletzt geladene **Vorlagen-ID** werden automatisch gesichert. Beim Reload wird die **gespeicherte Vorlage** (inkl. Bilder) wieder geladen.

**Bilder zuverlässig halten (empfohlen):**
1. Nach Logo/Hintergrund-Upload einmal **💾 Speichern** (Checkbox „Logo & Hintergrund“ an).
2. Ordner **📁 `Vorlagen json`** wählen — bei jedem Speichern wird zusätzlich eine JSON-Datei dort abgelegt.
3. Bilder liegen parallel in **IndexedDB** (Browser, großzügiger als `localStorage`) und werden beim Laden aus Vorlage + IDB zusammengeführt.

**Schneller Workflow mit Assets:** Bilder aus `Vorlagen Garderobenschilder/` sind auf GitHub Pages direkt in der **Asset-Bibliothek** verfügbar. Fonts aus `Fonts/` werden automatisch geladen und erscheinen direkt im Schrift-Kachelraster. Für **Name** und **Nummer/Badge** kann je eine eigene Schrift gewählt werden. Lokal kannst du zusätzlich eigene, nicht committete Ordner über **📁 Vorlagen-Bilder** und **🔤 Fonts** freigeben.

**Zusätzliche Webfonts:** Neben den lokalen Fonts sind auch **Graduate**, **Orbitron**, **Exo 2** und **Saira Stencil One** direkt integriert.

**Sidebar:** Die linke Seitenleiste ist am rechten Rand ziehbar; die Breite wird im Browser gespeichert. Praktisch für lange Font-Namen im Schrift-Kachelraster.

**Vorlagen bearbeiten:** Beim Auswählen einer Vorlage wird ihr Name automatisch ins Feld **Name** übernommen. Änderungen können direkt mit **💾 Speichern** wieder unter derselben Vorlage gesichert werden.

**Batch-Filter:** Im Batch-Bereich kann der Export auf **alle Spieler**, **Goalies**, **Verteidiger** oder **Stürmer** begrenzt werden.

**Echte Vorschau:** Die Vorlagen-Kacheln werden als kleine komplette Schilder gerendert, inklusive gespeicherter Logos, Hintergründe, Positionen, Badge und aktuellem Spielertext.

**Scrollbare Design-Seite:** Die linke Design-Spalte scrollt unabhängig vom Editor, auch wenn viele grosse Vorschau-Kacheln vorhanden sind.

**Text-Boxen:** Name und Nummer werden direkt aus dem tatsächlich gerenderten Canvas-Text pixelgenau vermessen, damit auch breite/stencilartige Sport-Fonts sauberere Auswahlrahmen bekommen. Über **Textbox-Rand X/Y** kann der Rahmen je Vorlage zusätzlich vergrössert oder verkleinert werden.

### Badge & Grössen (Design)

Alle Grössen-Regler sind unter **Design → Badge & Grössen** gebündelt: Badge-Form/-Farbe/-%, Nummer, Name, Logo 1/2, Rahmen, Deckkraft. Bei aktivem Badge gibt es zusätzlich **Nummer im Badge X/Y**, um Ziffern je nach Font optisch in der Form zu zentrieren.

### Zwei Logos & Hilfslinien

- **Club-Logo 1 / 2** – separates Upload, Grösse unter Design → Badge & Grössen, Drag & Ecke zum Skalieren  
- **Hilfslinien** – Mitte, Drittel, Rand (Optionen → Sichtbarkeit); beim Ziehen rasten Elemente ein  
- **Druckrand (3 mm)** – roter Rahmen = Sicherheitszone (berechnet für 200×55 mm Schild); Inhalte werden beim Verschieben darin gehalten, Kanten rasten ein  
- **Logo-Bereich (Seitenstreifen)** – dunkler Streifen links/rechts; unter Optionen abschaltbar, falls Logos „auf Schwarz“ wirken

### Nummern-Badge

- **Nummer (Schrift)**: Grösse der Ziffer im Badge  
- **Badge-Grösse**: Skalierung der Form (25–160 %, Standard 72 %)  
- Nummern werden **ohne `#`** auf dem Schild angezeigt

### PDF-Druck (200×55 mm Schild auf A4/A3)

- **Optionen → Export → PDF (Druck)** oder **📄 PDF Druck (200×55 mm)**  
- Jedes Schild bleibt **200 × 55 mm** gross, mehrere pro Bogen: **A4** (5/Seite) oder **A3** (7/Seite)  
- **+ Einzelseiten (Canva):** zusätzlich je Schild eine eigene PDF-Seite (200×55 mm) – ideal für Canva/Online-Druck  
- **Schnittmarken** an Ecken und Kantenmitte zum Zuschneiden (ein/aus)  
- **📦 Alle PDF** / Batch: ein PDF mit allen Spielern (Bogen + optional Einzelseiten)  
- **Auflösung** 2× empfohlen für schärfere Rastergrafik im PDF

### Nummern-Badge (Erweitert)

- **Badge-Füllung** + **Deckkraft** (Transparenz im Kreis)  
- **Umrandung** – eigene Farbe wählbar (Standard: Weiss)
