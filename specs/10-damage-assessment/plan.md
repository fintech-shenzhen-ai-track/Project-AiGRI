# 10 Damage Assessment: plan

## Owns

`backend/aigri/damage/`, migration `0010_*` (`damage_assessments`, `photo_checks`, `tag_checks`). No routes of its own: features 11 (claims) and 13 (portfolio) expose its records.

## Layout

```
damage/
  stac.py            search + sign (pystac-client, planetary-computer), scene selection
  load.py            stackstac to UTM, caching to MinIO as COGs
  s1_flood.py        thresholds, change detection, permanent water removal, flooded-vegetation flag
  duration.py
  s2_ndvi.py         SCL mask, NDVI medians, valid share
  published/gfm.py   GFM API client (token from env), layers per AOI and date
  published/national.py  BRIN/BNPB (ID), PhilSA/UNOSAT (PH) vectors when available
  clip.py            rasterio mask per polygon; PostGIS intersection for vectors
  crosscheck.py, confidence.py, assessed_loss.py
  imagery.py         per-parcel before/after PNG renders with attribution
  livestock.py       tag reads (quarantined vision), checks
  photos.py          per-photo checks
  fixtures.py        fixture-mode writer (D-05)
  config/thresholds.yaml, config/vulnerability_flood.yaml, config/confidence.yaml
  tools.py           damage.assess (Tier 0)
```

## Python dependencies

`pystac-client`, `planetary-computer`, `stackstac`, `xarray`, `rasterio`, `rioxarray`, `geopandas`, `shapely`, `numpy`, `ImageHash`, `Pillow`. Pin versions; GDAL comes from the base image (use an image with GDAL preinstalled for the worker).

## Worker sizing

Damage jobs run in the `worker` service with a dedicated queue and concurrency 1–2; scenes are cached by STAC item id so reruns and multiple parcels reuse them.

## Validation harness

`damage/validate.py` takes a Loss Event, a set of polygons and a reference map (GFM or PhilSA vectors), runs the pipeline, and outputs per-polygon flooded % pairs plus IoU of flood masks; feature 16 calls it for the accuracy suite. Real events for the ID pack: Demak around 8 Feb 2024 and 16–17 Mar 2024 (D-05); choose scene dates from STAC search results, not from memory, and record them in the report.

## Fixture values (hero claim)

From PLAN 2.8: DMK-01 92% / 9 days / NDVI 0,72 → 0,18 / −75% / High / assessed 92; DMK-02 78% / 8 / 0,70 → 0,26 / −63% / High / 75; DMK-03 64% / 6 / 0,69 → 0,35 / −49% / High / 55; DMK-04 41% / 4 / 0,71 → 0,49 / −31% / Medium / 30; DMK-05 not detected / — / 0,68 → 0,55 / −19% / Low (dense canopy) / 20. Scene dates: S-1 before 2 Feb 2026, after 8 and 14 Feb; S-2 before 28 Jan, after 15 Feb. Duration in fixtures is a range with min = max = the PLAN value.
