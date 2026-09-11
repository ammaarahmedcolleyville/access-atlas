# Branding

## Name

**Access Atlas.** "Access" names the specific problem (healthcare access, not health in general); "Atlas" signals a reference tool you consult and explore, not a one-time report.

## Logo concept

A location pin (this is fundamentally a *map*) with a medical cross inside it (this is fundamentally about *healthcare*). `docs/assets/logo.svg` — a single flat-color SVG, so it stays crisp at any size and costs nothing to load.

## Color palette

Access Atlas uses a validated, colorblind-safe palette (documented in full in Claude's `dataviz` skill reference palette) rather than an arbitrary brand color choice. Every hue was checked against simulated color-vision deficiency before being used anywhere on the site.

| Role | Color | Why |
|---|---|---|
| Primary brand / links | `#2a78d6` (blue) | Calm, trustworthy, standard in health-tech contexts; also the base of the sequential map ramp |
| Accent | `#eb6834` (orange) | Reserved for a second data series (comparison charts), never used decoratively |
| Status — critical / good | `#d03b3b` / `#0ca30c` | Reserved exclusively for shortage-designation badges; never reused for anything else, and always paired with a text label, never color alone |
| Map magnitude scale | 7-step blue ramp, light → dark | Sequential (single hue) because the map always encodes *magnitude* of one metric, never *category* |

Full rationale for these rules — why sequential vs. categorical, why status colors are reserved, contrast requirements — is in Claude's dataviz skill; the short version is: **color always has one job per chart, decided before any hex code is picked.**

## Typography

System font stack (`system-ui, -apple-system, "Segoe UI", sans-serif`) everywhere, including headings. This was a deliberate choice, not a missing feature:

- Loads instantly with zero network requests (no font file to fetch), which matters on a data-heavy site already loading map tiles and JSON.
- Renders in the OS's native, most-legible font for each visitor rather than importing a single aesthetic choice that may render worse on some systems.
- Numbers in tables and axis labels use `font-variant-numeric: tabular-nums` so digits align in columns; large standalone numbers (the homepage stat tiles) use normal proportional figures, which read better at large sizes.

## Voice

Plain language over jargon wherever possible; where a technical term is unavoidable (HPSA, age-adjusted prevalence), it is defined in place, not assumed. The site is direct about its own limitations rather than overselling what county-level public data can tell you — see the Methodology page's Limitations section.
