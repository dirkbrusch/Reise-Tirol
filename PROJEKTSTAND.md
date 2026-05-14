# Projektstand Reise-Tirol (zum Wiederaufrufen)

Diese Datei beschreibt einen **gesicherten Arbeitsstand** auf deinem Rechner. Zum Fortsetzen lies unten **„So machst du weiter“**.

## Fixe Referenzen

| Feld | Wert |
|------|------|
| **Lokaler Pfad (Beispiel)** | `C:\Users\kevin\dev\Reise-Tirol` |
| **Remote (GitHub)** | https://github.com/dirkbrusch/Reise-Tirol.git |
| **Branch** | `feat/stage-1-quickwins` |
| **Commit (vollständig)** | `c8af76606064e513d156a5a6bfbe100a9ea9c1e5` |
| **Kurz-Hash** | `c8af766` |

## Was in diesem Stand steckt (Kurz)

- **Checklisten** aus Markdown (`- [ ] …`) mit Speicher in `localStorage`, Sammel-Ansicht über die Topbar (Symbol mit Klemmbrett)
- **Wetter** über Open-Meteo (3-Tage, Auffach-Umgebung), kurz gecacht
- **Feedback** unter H3 (`👍` / `👎`), lokal gespeichert
- **Tageswahl** über `days.json` + **`<!-- day:YYYY-MM-DD -->`**-Kommentare in `reiseplan.md` (Abschnitt M), Heute-Karte im Hero
- **PWA**: `manifest.webmanifest`, `service-worker.js` (Cache-Name **`rt-v2`**), Offline-Hinweis, Install-Button wenn der Browser unterstützt
- **Karte** (Leaflet + OSM) aus `places.json`
- **KI-Panel** („Bring-your-own-Key“, Key nur **sessionStorage**, OpenAI kompatibel)
- **Frontend aufgeteilt**: `assets/app.css`, `assets/app.js`; `index.html` ist die Hülle

## Wichtige Dateien im Repo

```
index.html
reiseplan.md
days.json
places.json
manifest.webmanifest
service-worker.js
assets/app.css
assets/app.js
assets/icon.svg
README.md
CNAME
```

## So machst du weiter (Windows)

1. **Ordner in Cursor öffnen**  
   `Datei → Ordner öffnen` → `C:\Users\kevin\dev\Reise-Tirol`

2. **Branch und Stand prüfen**
   ```powershell
   cd C:\Users\kevin\dev\Reise-Tirol
   git checkout feat/stage-1-quickwins
   git log -1 --oneline
   ```
   Erwartet: Branch `feat/stage-1-quickwins`, letzter Commit beginnt mit `c8af766`.

3. **Lokal im Browser testen** (ohne eigenen Server funktioniert `fetch()` zu `reiseplan.md` meist nicht):
   ```powershell
   cd C:\Users\kevin\dev\Reise-Tirol
   npx --yes serve .
   ```
   Dann die angezeigte HTTP-URL im Browser öffnen.

## Nach GitHub pushen (wenn du Schreibrecht hast)

```powershell
cd C:\Users\kevin\dev\Reise-Tirol
git push -u origin feat/stage-1-quickwins
```

Sonst: Fork erstellen und `git remote add` auf deinen Fork, dann pushen und Pull Request ins Original-Repo.

## Hinweise

- **Neue Dateien unter Windows:** Wenn etwas „kaputt“ wirkt (seltsame Zeichen in `.js`), prüfe **UTF-8** (ohne UTF-16). Editor: unten „UTF-8“ anzeigen lassen.
- **KI:** Kein API-Key liegt im Repo; Nutzer trägt den Key in der Oberfläche ein (nur diese Browser-Sitzung).

---
*Stand dokumentiert für Commit `c8af766` auf Branch `feat/stage-1-quickwins`.*
