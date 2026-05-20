# PlateForge

Eishockey-Garderoben-Schilder (2000×550 px) — Editor, Team-Roster, Batch-Export.

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

*SVG-Logos in maximaler Schärfe auf der Canvas-Vorschau: kann man gezielt verbessern (z. B. höher aufgelöst rasterisieren beim Zeichnen) — bei Bedarf als nächster Schritt.*
