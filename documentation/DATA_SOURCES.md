# Data Sources

Access Atlas joins four public datasets on the 5-digit Texas county FIPS code. This document is the technical companion to the plain-language version on the site's [Methodology page](../docs/methodology.html).

## 1. HRSA Health Professional Shortage Areas (HPSA) — Primary Care

- **Publisher:** Health Resources & Services Administration (HRSA), U.S. Department of Health and Human Services
- **File used:** `BCD_HPSA_FCT_DET_PC.csv` (national file, filtered to `Primary State Abbreviation == "TX"`)
- **Retrieved:** September 2026, from `https://data.hrsa.gov/DataDownload/DD_Files/BCD_HPSA_FCT_DET_PC.csv`
- **Update cadence:** HRSA refreshes this file daily; figures here reflect a single point-in-time snapshot.
- **Key fields used:** `HPSA Status` (we keep only `Designated`, i.e. currently active), `HPSA Score` (0–26), `HPSA Estimated Underserved Population`, `Common State County FIPS Code`.
- **Known quirk:** a single county can have multiple overlapping HPSA records (e.g. a low-income-population designation and a separate facility-based designation). We count active designations per county and sum underserved population across them — which can double-count residents. See Limitations.

## 2. County Health Rankings & Roadmaps — 2025 Texas Data

- **Publisher:** University of Wisconsin Population Health Institute, in partnership with the Robert Wood Johnson Foundation
- **File used:** `2025 County Health Rankings Texas Data - v3.xlsx`, sheets `Select Measure Data` and `Additional Measure Data`
- **Retrieved:** September 2026, from `https://www.countyhealthrankings.org/health-data/texas/data-and-resources`
- **Fields used:** Primary Care Physicians Rate/Ratio, Mental Health Provider Rate/Ratio, Dentist Rate/Ratio, % Uninsured, Preventable Hospitalization Rate, % Children in Poverty, Life Expectancy, Median Household Income, % Rural, Population.
- **Known quirk:** the Excel file has a title row above the real header row, so the pipeline reads with `header=1`.

## 3. CDC PLACES — 2025 Release, County Data

- **Publisher:** Centers for Disease Control and Prevention, in partnership with the CDC Foundation
- **Access method:** Socrata SODA API, queried directly for Texas: `https://data.cdc.gov/resource/swc5-untb.csv?stateabbr=TX&$limit=50000`
- **Retrieved:** September 2026
- **Underlying survey:** Behavioral Risk Factor Surveillance System (BRFSS), combined with a small-area estimation statistical model — these are modeled estimates, not a census.
- **Measures used:** see `PLACES_MEASURES` in `data-pipeline/scripts/03_clean_and_join.py` for the exact list (diabetes, high blood pressure, obesity, asthma, coronary heart disease, depression, frequent mental distress, fair/poor self-rated health, annual checkup, no leisure-time physical activity).
- **Value type priority:** age-adjusted prevalence (`AgeAdjPrv`) is preferred over crude prevalence (`CrdPrv`) per measure/county; falls back to crude when age-adjusted isn't published.

## 4. U.S. Census Bureau — 2024 Cartographic Boundary File

- **Publisher:** U.S. Census Bureau
- **File used:** `cb_2024_us_county_20m.zip` (1:20,000,000 scale shapefile), filtered to `STATEFP == "48"` (Texas)
- **Retrieved:** September 2026, from `https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_20m.zip`
- **Conversion:** read with `pyshp` (pure Python, no GDAL dependency) and converted to GeoJSON in `data-pipeline/scripts/02_extract_geometry.py`.

## Join key

All statistical sources publish a 5-digit FIPS code. The pipeline zero-pads every FIPS value to 5 digits and joins strictly on that key — no name-matching or fuzzy geocoding is used anywhere.

## Reproducing the pipeline

```bash
cd data-pipeline
pip install pandas requests openpyxl pyshp
python scripts/01_fetch_data.py        # downloads raw data into data-pipeline/raw/
python scripts/02_extract_geometry.py  # writes docs/data/tx_counties.geojson
python scripts/03_clean_and_join.py    # writes docs/data/counties.json, meta.json, and access_atlas.db
```

Each script can be re-run independently to pull current data; none of them require credentials.
