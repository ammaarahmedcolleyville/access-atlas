"""
Access Atlas - Step 2: Extract Texas county boundaries as GeoJSON.

Source: U.S. Census Bureau 2024 Cartographic Boundary File (county, 1:20,000,000).
We read the shapefile with pyshp (pure Python, no GDAL needed) and keep only
Texas counties (STATEFP == '48'), writing a compact GeoJSON for the web map.
"""

import json
import pathlib

import shapefile  # pyshp

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
SHP_PATH = REPO_ROOT / "data-pipeline" / "raw" / "cb_2024_us_county_20m" / "cb_2024_us_county_20m.shp"
OUT_PATH = REPO_ROOT / "docs" / "data" / "tx_counties.geojson"


def main() -> None:
    sf = shapefile.Reader(str(SHP_PATH))
    field_names = [f[0] for f in sf.fields[1:]]  # skip deletion flag

    features = []
    for sr in sf.iterShapeRecords():
        rec = dict(zip(field_names, sr.record))
        if rec.get("STATEFP") != "48":
            continue
        geom = sr.shape.__geo_interface__
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "fips": rec["GEOID"],
                    "name": rec["NAME"],
                },
                "geometry": geom,
            }
        )

    geojson = {"type": "FeatureCollection", "features": features}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(geojson), encoding="utf-8")
    print(f"Wrote {len(features)} Texas county features -> {OUT_PATH}")
    if len(features) != 254:
        print(f"WARNING: expected 254 Texas counties, got {len(features)}")


if __name__ == "__main__":
    main()
