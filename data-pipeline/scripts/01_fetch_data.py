"""
Access Atlas - Step 1: Fetch raw data from public sources.

Downloads three legitimate public datasets:
  1. HRSA HPSA Primary Care shortage area designations (national file, we filter to TX later)
  2. County Health Rankings 2025 - Texas data file
  3. CDC PLACES 2025 county-level data (queried directly for Texas via Socrata API)

Each source is documented in /documentation/DATA_SOURCES.md with retrieval date and URL.
Run this script from anywhere; paths are relative to the repo root.
"""

import pathlib
import sys

import requests

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "data-pipeline" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

SOURCES = {
    "hrsa_hpsa_primary_care.csv": "https://data.hrsa.gov/DataDownload/DD_Files/BCD_HPSA_FCT_DET_PC.csv",
    "county_health_rankings_tx_2025.xlsx": (
        "https://www.countyhealthrankings.org/sites/default/files/media/document/"
        "2025%20County%20Health%20Rankings%20Texas%20Data%20-%20v3.xlsx"
    ),
    # Socrata SODA API, filtered server-side to Texas so we don't pull the full national file
    "cdc_places_tx_2025.csv": (
        "https://data.cdc.gov/resource/swc5-untb.csv?stateabbr=TX&$limit=50000"
    ),
    # Census cartographic boundary file (national); we filter to Texas (STATEFP=48) when processing
    "cb_2024_us_county_20m.zip": (
        "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_20m.zip"
    ),
}

HEADERS = {"User-Agent": "AccessAtlas-StudentProject/1.0 (educational use; contact via GitHub repo)"}


def fetch(name: str, url: str) -> None:
    dest = RAW_DIR / name
    print(f"Fetching {name} ...")
    resp = requests.get(url, headers=HEADERS, timeout=120)
    resp.raise_for_status()
    dest.write_bytes(resp.content)
    size_kb = dest.stat().st_size / 1024
    print(f"  -> saved {dest} ({size_kb:,.1f} KB)")


def main() -> None:
    failures = []
    for name, url in SOURCES.items():
        try:
            fetch(name, url)
        except Exception as exc:  # noqa: BLE001
            print(f"  !! FAILED: {name}: {exc}")
            failures.append(name)
    if failures:
        print(f"\n{len(failures)} download(s) failed: {failures}")
        sys.exit(1)
    print("\nAll sources downloaded successfully.")


if __name__ == "__main__":
    main()
