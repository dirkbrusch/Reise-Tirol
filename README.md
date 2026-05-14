# Reise-Tirol

Statische Website mit der Reisedokumentation Wildschönau / Auffach 21.05.–06.06.2026.

**Live:** https://reise.brusch.info

## Projekt lokal wiederfinden (Stand Entwicklung)

- **Klone-Pfad auf diesem PC (Beispiel):** `C:\Users\kevin\dev\Reise-Tirol`
- **Aktuelle Entwicklung:** Branch `feat/stage-1-quickwins` (alle geplanten Stufen 1–4 in diesem Arbeitsstand gebündelt; nach Review gern in kleinere Branches oder PRs splitten.)
- **Lokal öffnen:** Ordner in Cursor **File → Open Folder** öffnen, oder im Browser einen statischen Server nutzen (`npx serve .` im Projektroot), da `fetch` für `reiseplan.md` / JSON von `file://` oft blockiert wird.

## Aufbau
- `index.html` — Shell; Styles in `assets/app.css`, Logik in `assets/app.js` (Single-Page, lädt `reiseplan.md` per Fetch, rendert mit marked.js).
- `reiseplan.md` — Quelldatei des Plans; Tagesmarker `<!-- day:YYYY-MM-DD -->` vor jedem Eintrag im Kalenderbereich Abschnitt M.
- `days.json` — Strukturierte Tagesdaten für Tageswähler / Heute-Karte (mit `places.json`).
- `places.json` — POI für die Karte.
- `manifest.webmanifest`, `service-worker.js` — PWA / Offline (`rt-v2` Cache).
- `CNAME` — Custom-Domain-Eintrag für GitHub Pages.

## Aktualisieren
Markdown oder JSON bearbeiten, committen, pushen — Änderungen sind nach ~1 Min. live.

## Hosting
GitHub Pages aus dem `main`-Branch (Root). Custom Domain: `reise.brusch.info`.
DNS: CNAME-Record `reise` → `dirkbrusch.github.io`.
