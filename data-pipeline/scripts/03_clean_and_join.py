"""
Access Atlas - Step 3: Clean, transform, and join the three source datasets
into one county-level table, stored in SQLite and exported to JSON for the site.

Design notes (documented further in /documentation/METHODOLOGY.md):

- Join key: 5-digit Texas county FIPS code ("48XXX"), the standard geographic
  identifier used by the Census Bureau and adopted by both HRSA and CDC.
- HPSA data: we count only designations with HPSA Status == "Designated"
  (i.e. currently active), not "Withdrawn" or "Proposed For Withdrawal".
  A county can have multiple overlapping HPSA service areas (e.g. separate
  low-income and migrant-worker designations), so "estimated underserved
  population" is summed across designations and documented as an upper-bound
  estimate, not a deduplicated headcount.
- CDC PLACES: for each health measure we prefer the age-adjusted prevalence
  (AgeAdjPrv) over crude prevalence (CrdPrv) because age-adjustment lets us
  compare counties fairly even when their age distributions differ (e.g. a
  retirement-heavy county vs. a county full of college students). Some
  measures (mostly behaviors, not disease prevalence) are only published as
  crude prevalence, in which case we fall back to that and record which type
  was used.
- All rates/ratios are shown as published by the source agencies. No values
  are invented, imputed, or estimated beyond what the source already provides.
"""

import json
import pathlib
import sqlite3

import pandas as pd

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = REPO_ROOT / "data-pipeline" / "raw"
PROCESSED = REPO_ROOT / "data-pipeline" / "processed"
DB_PATH = REPO_ROOT / "data-pipeline" / "access_atlas.db"
SITE_DATA = REPO_ROOT / "docs" / "data"

PROCESSED.mkdir(parents=True, exist_ok=True)
SITE_DATA.mkdir(parents=True, exist_ok=True)

# CDC PLACES measures we surface, and the label used in the UI
PLACES_MEASURES = {
    "Diagnosed diabetes among adults": "diabetes_pct",
    "High blood pressure among adults": "high_blood_pressure_pct",
    "Obesity among adults": "obesity_pct",
    "Current asthma among adults": "asthma_pct",
    "Coronary heart disease among adults": "heart_disease_pct",
    "Depression among adults": "depression_pct",
    "Frequent mental distress among adults": "frequent_mental_distress_pct",
    "Fair or poor self-rated health status among adults": "fair_or_poor_health_pct",
    "Visits to doctor for routine checkup within the past year among adults": "annual_checkup_pct",
    "No leisure-time physical activity among adults": "no_physical_activity_pct",
}


def load_hpsa() -> pd.DataFrame:
    df = pd.read_csv(RAW / "hrsa_hpsa_primary_care.csv", low_memory=False)
    tx = df[df["Primary State Abbreviation"] == "TX"].copy()
    tx["fips"] = tx["Common State County FIPS Code"].astype(str).str.zfill(5)

    active = tx[tx["HPSA Status"] == "Designated"].copy()

    agg = active.groupby("fips").agg(
        hpsa_active_count=("HPSA ID", "nunique"),
        hpsa_max_score=("HPSA Score", "max"),
        hpsa_underserved_population=("HPSA Estimated Underserved Population", "sum"),
    ).reset_index()

    return agg


def load_chr() -> pd.DataFrame:
    xlsx = RAW / "county_health_rankings_tx_2025.xlsx"

    select = pd.read_excel(xlsx, sheet_name="Select Measure Data", header=1)
    select = select[select["County"].notna()].copy()
    select["fips"] = select["FIPS"].astype(str).str.zfill(5)
    select_cols = {
        "fips": "fips",
        "County": "county_name",
        "Primary Care Physicians Rate": "pcp_rate_per_100k",
        "Primary Care Physicians Ratio": "pcp_ratio",
        "Mental Health Provider Rate": "mental_health_provider_rate_per_100k",
        "Mental Health Provider Ratio": "mental_health_provider_ratio",
        "Dentist Rate": "dentist_rate_per_100k",
        "Dentist Ratio": "dentist_ratio",
        "% Uninsured": "uninsured_pct",
        "Preventable Hospitalization Rate": "preventable_hospitalization_rate",
        "% Children in Poverty": "child_poverty_pct",
    }
    select = select[list(select_cols)].rename(columns=select_cols)

    addl = pd.read_excel(xlsx, sheet_name="Additional Measure Data", header=1)
    addl = addl[addl["County"].notna()].copy()
    addl["fips"] = addl["FIPS"].astype(str).str.zfill(5)
    addl_cols = {
        "fips": "fips",
        "Life Expectancy": "life_expectancy_years",
        "Median Household Income": "median_household_income",
        "% Rural": "rural_pct",
        "Population": "population",
    }
    addl = addl[list(addl_cols)].rename(columns=addl_cols)

    return select.merge(addl, on="fips", how="outer")


def load_places() -> pd.DataFrame:
    df = pd.read_csv(RAW / "cdc_places_tx_2025.csv", low_memory=False)
    df = df[df["measure"].isin(PLACES_MEASURES)].copy()
    df["fips"] = df["locationid"].astype(str).str.zfill(5)

    # prefer age-adjusted prevalence; fall back to crude prevalence per measure/county
    df["type_priority"] = df["datavaluetypeid"].map({"AgeAdjPrv": 0, "CrdPrv": 1})
    df = df.sort_values("type_priority").drop_duplicates(subset=["fips", "measure"], keep="first")

    wide = df.pivot(index="fips", columns="measure", values="data_value").reset_index()
    wide = wide.rename(columns=PLACES_MEASURES)

    type_used = df.pivot(index="fips", columns="measure", values="datavaluetypeid").reset_index()
    type_used = type_used.rename(columns={m: f"{c}_source_type" for m, c in PLACES_MEASURES.items()})

    return wide.merge(type_used, on="fips", how="left")


def main() -> None:
    hpsa = load_hpsa()
    chr_df = load_chr()
    places = load_places()

    merged = chr_df.merge(hpsa, on="fips", how="left").merge(places, on="fips", how="left")

    # counties with zero active HPSA designations are genuinely zero, not missing
    merged["hpsa_active_count"] = merged["hpsa_active_count"].fillna(0).astype(int)
    merged["hpsa_underserved_population"] = merged["hpsa_underserved_population"].fillna(0)

    merged = merged.sort_values("county_name").reset_index(drop=True)

    # --- data quality report: how complete is each column? ---
    completeness = (merged.notna().mean() * 100).round(1).to_dict()

    # --- write to SQLite (serves as the durable, queryable copy of the pipeline output) ---
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    merged.to_sql("county_metrics", conn, index=False)
    conn.close()

    # --- export processed CSV (for transparency / re-use) ---
    merged.to_csv(PROCESSED / "county_metrics.csv", index=False)

    # --- export JSON for the static site ---
    records = json.loads(merged.to_json(orient="records"))
    (SITE_DATA / "counties.json").write_text(json.dumps(records), encoding="utf-8")

    meta = {
        "counties": len(merged),
        "columns": list(merged.columns),
        "completeness_pct": completeness,
        "sources": [
            "HRSA Health Professional Shortage Area (HPSA) Primary Care designations",
            "County Health Rankings & Roadmaps 2025 (Texas)",
            "CDC PLACES 2025 county-level estimates",
            "U.S. Census Bureau 2024 Cartographic Boundary File (county geometry)",
        ],
    }
    (SITE_DATA / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print(f"Joined {len(merged)} Texas counties, {len(merged.columns)} columns.")
    print("Completeness (% non-null) for key fields:")
    for col in ["pcp_rate_per_100k", "uninsured_pct", "hpsa_active_count", "diabetes_pct", "life_expectancy_years"]:
        print(f"  {col}: {completeness.get(col, 'N/A')}%")


if __name__ == "__main__":
    main()
