# Architecture

## Why this shape

Access Atlas is a **static site backed by a batch data pipeline**, not a live web app with a database server. That's a deliberate choice, not a shortcut:

- The underlying data (HPSA designations, County Health Rankings, CDC PLACES) updates at most a few times a year — there is no need for a live database or API server.
- A static site is free to host reliably (GitHub Pages), has no server to secure or patch, and cannot leak data because it holds no user data beyond anonymous, optional feedback.
- It keeps the whole system understandable end-to-end by one person: download → clean → join → export → static files → browser.

## Data flow

```
HRSA (CSV)  ─┐
CHR (XLSX)  ─┼─▶ data-pipeline/scripts/01_fetch_data.py   (raw downloads → data-pipeline/raw/)
CDC (API)   ─┘
Census (SHP)──▶ data-pipeline/scripts/02_extract_geometry.py  (→ docs/data/tx_counties.geojson)

data-pipeline/raw/* ──▶ data-pipeline/scripts/03_clean_and_join.py
                          │
                          ├─▶ data-pipeline/access_atlas.db      (SQLite, queryable copy)
                          ├─▶ data-pipeline/processed/county_metrics.csv
                          └─▶ docs/data/counties.json + meta.json   (what the site actually fetches)

docs/*.html + docs/js/*.js  ──▶ fetch()'s docs/data/*.json + *.geojson at page load, entirely client-side
```

Why SQLite exists even though the site never queries it directly: it's the durable, indexable form of the cleaned dataset — useful for ad hoc analysis (`sqlite3 access_atlas.db`) and for any future feature that needs real queries (e.g., a search API) without re-running the whole pipeline.

## Frontend

Plain HTML/CSS/JavaScript, no build step, no framework. This was a deliberate choice given the project's scope:

- Every page is a complete, readable file — helpful for a first-time programmer to trace what's happening without a bundler/transpiler in the way.
- No `npm install`, no build pipeline to break, no dependency-version drift — it will still run correctly in 5 years.
- [Leaflet](https://leafletjs.com/) (via CDN) renders the county choropleth map; everything else (comparison bars, tables, stat tiles) is hand-built HTML/CSS to keep full control over accessibility and the color rules documented in `documentation/BRANDING.md`.

`docs/js/app.js` is the single source of truth for metric labels, units, and "higher is better?" direction (`AccessAtlas.METRICS`) — every page reads from it, so a metric's label or direction only ever needs to change in one place.

## Why GitHub Pages

- Free, reliable, and the canonical way to publish a static site tied to its own public source repository — appropriate for a transparent, citation-heavy public-data project.
- Deploys straight from the `docs/` folder on the `main` branch, so "the code" and "the live site" are never out of sync.

## What would change at real scale

This architecture is right-sized for ~254 rows of county data. It would need to change if the project grew to (for example) census-tract-level data for the whole US: at that point, `docs/data/counties.json` (a few hundred KB) would become tens of megabytes, and a real API layer (or at least paginated/tiled data) would replace "fetch the whole JSON file on every page load."
