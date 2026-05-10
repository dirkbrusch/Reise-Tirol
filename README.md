# Reise-Tirol

Statische Website mit der Reisedokumentation Wildschönau / Auffach 21.05.–06.06.2026.

**Live:** https://reise.brusch.info

## Aufbau
- `index.html` — Single-Page-Site mit Sidebar-Navigation, lädt `reiseplan.md` per Fetch und rendert ihn clientseitig via marked.js.
- `reiseplan.md` — Quelldatei (V2 des Reiseplans).
- `CNAME` — Custom-Domain-Eintrag für GitHub Pages.

## Aktualisieren
Markdown bearbeiten, committen, pushen — Änderungen sind nach ~1 Min. live.

## Hosting
GitHub Pages aus dem `main`-Branch (Root). Custom Domain: `reise.brusch.info`.
DNS: CNAME-Record `reise` → `dirkbrusch.github.io`.
