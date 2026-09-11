# Changelog

All notable changes to Access Atlas are logged here, most recent first.

## v1.0.0 — 2026-09-11

Initial public release.

- Data pipeline: fetches and joins HRSA HPSA, County Health Rankings 2025, CDC PLACES 2025, and U.S. Census county boundaries for all 254 Texas counties.
- Interactive choropleth map (`explore.html`) with 14 selectable metrics, county search, click-to-inspect detail panel, and a table-view fallback.
- County comparison tool (`compare.html`) supporting 2–4 counties side by side, with a full metric table and grouped bar-chart comparisons.
- Landing page with live-computed headline statistics (not hardcoded) drawn from the same dataset the rest of the site uses.
- About, Methodology (data sources, definitions, limitations), and Feedback pages.
- Usability testing plan and feedback categorization framework (`documentation/USER_TESTING.md`).
