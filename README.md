# Reise-Tirol – Wildschönau Reise-Guide

PWA-Web-App für die Familienreise **Wildschönau / Auffach** (21.05.–06.06.2026): Tagesübersicht, vollständiger Reiseplan, Karte, Checkliste, optional Familien-Sync und KI-Assistent.

## Wo liegt das Projekt?

| Was | Pfad / URL |
|-----|------------|
| **Lokal (dieser PC)** | `C:\Users\kevin\dev\Reise-Tirol` |
| **Git-Repository** | https://github.com/dirkbrusch/Reise-Tirol |
| **Live (GitHub Pages)** | https://reise.brusch.info |
| **Branch für Deploy** | `main` |
| **Custom Domain** | `reise.brusch.info` (CNAME → GitHub Pages) |

In Cursor: **File → Open Folder** → `C:\Users\kevin\dev\Reise-Tirol`

---

## Tech-Stack

- **React 19** + **TypeScript** + **Vite 6**
- **React Router** (`HashRouter`) – wichtig für GitHub Pages ohne Server-Rewrites
- **Leaflet** / react-leaflet (Karte)
- **marked** (Markdown → HTML für den Reiseplan)
- **Supabase** (optional: Checklisten-Sync, Feedback zwischen Geräten)
- **vite-plugin-pwa** (Service Worker, Offline-Basis)
- Deploy: **GitHub Actions** → Production-Bundle ins Repo-Root (Legacy Pages: `main` / `/`)

---

## App-Struktur (Views)

| Route | View | Funktion |
|-------|------|----------|
| `/#/` | Heute | Wetter, Reisetag wählen, Tageskarte, Schnellzugriff |
| `/#/plan` | Plan | Sidebar-Inhaltsverzeichnis, Markdown-Reiseplan, Tagesfilter |
| `/#/karte` | Karte | POIs aus `places.json`, Filter, Standort |
| `/#/liste` | Checkliste | Aufgaben aus Plan-Anhang, lokal + optional Supabase |

Zusätzlich: Theme (hell/dunkel), Familien-Sync-Overlay, KI-Panel (eigener API-Key, nur lokal gespeichert).

---

## Projektaufbau

```
Reise-Tirol/
├── content/
│   ├── reiseplan.md
│   ├── days.json
│   └── places.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── context/AppContext.tsx
│   ├── views/          (TodayView, PlanView, MapView, ChecklistView)
│   ├── components/
│   ├── lib/            (scrollToAnchor.ts, sync, weather, …)
│   └── styles/         (app.css, shell.css, vite-fixes.css)
├── index.dev.html      (Dev: /src/main.tsx)
├── index.html          (Production: /assets/index-*.js)
├── scripts/use-dev-index.mjs
├── .github/workflows/deploy.yml
└── assets/             (gebaute Bundles im Root für Pages)
```

---

## Entwicklung (lokal)

**Voraussetzungen:** Node.js 20+, npm

```bash
cd C:\Users\kevin\dev\Reise-Tirol
npm ci
npm run dev
```

Öffnen: http://localhost:5173

**Production-Build testen:**

```bash
npm run build
npm run preview
```

`npm run build` kopiert `index.dev.html` → `index.html`, baut nach `dist/`.

---

## Deploy (GitHub Pages)

Bei Push auf `main` (`.github/workflows/deploy.yml`):

1. `npm ci` + `npm run build`
2. `content/` → `dist/content/`
3. `dist/*` → Repo-Root
4. Commit `chore: deploy production bundle [skip ci]` + Push

Pages: **Legacy**, Branch `main`, Ordner `/`. Nach Deploy: **Strg+Shift+R**.

### GitHub Secrets

| Secret | Zweck |
|--------|--------|
| `VITE_SUPABASE_URL` | Supabase-URL |
| `VITE_SUPABASE_ANON_KEY` | Anon Key |
| `VITE_DEFAULT_TRIP_CODE` | z. B. `WILD2026` |

---

## Inhalt pflegen

| Datei | Inhalt |
|-------|--------|
| `content/reiseplan.md` | Gesamtplan (Markdown) |
| `content/days.json` | 17 Reisetage |
| `content/places.json` | Karten-POIs |

Tagesmarker: `<!-- day:YYYY-MM-DD -->` (Abschnitt M). Deep-Link: `?day=YYYY-MM-DD`

---

## Wichtige technische Hinweise

### HashRouter und Plan-Sidebar

Routen: `/#/plan`. Links `href="#abschnitt"` zerstoeren die Route.

**Fix:** `src/lib/scrollToAnchor.ts` – scrollt per `scrollIntoView` + `preventDefault`.

### Zwei index.html

| Datei | Zweck |
|-------|--------|
| `index.dev.html` | Dev: `/src/main.tsx` |
| `index.html` | Production: `/assets/index-*.js` |

Vor Build: `node scripts/use-dev-index.mjs` (in `npm run build` enthalten).

### CSS

- `app.css` – Legacy
- `vite-fixes.css` – Lesbarkeit, volle Breite, helle Plan-Sidebar
- **UTF-8 ohne BOM** speichern

### Plan-Sidebar mobil

„☰ Inhalt“-Button → Drawer; ab 921px Sidebar dauerhaft sichtbar.

---

## MVP-Status

**Stabil:** Breite, Lesbarkeit, Plan-Sidebar, Deploy-Workflow.

**Offen:** Supabase/KI-Konfiguration, vollständiges QA, PWA-Offline.

---

## Troubleshooting

| Problem | Lösung |
|---------|---------|
| Alte Version | Hard-Reload, SW leeren |
| Sidebar springt weg | Cache leeren |
| Build fast leer | `use-dev-index.mjs` vor Build |
| Weiss auf Weiss | `vite-fixes.css` UTF-8 prüfen |
| fetch leer lokal | `npm run dev` nutzen |

---

## Kontakt

Privates Familienprojekt: **dirkbrusch/Reise-Tirol**. DNS: CNAME `reise` → `dirkbrusch.github.io`.