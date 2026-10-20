# 13 Insurer dashboard and portfolio: plan

## Owns

Routers `insurer_dashboard.py`, `insurer_portfolio.py`; `portals/app/insurer/dashboard/`, `portals/app/insurer/portfolio/`. No tables: SQL views in migration `0013_*` (`v_insurer_claim_kpis`, `v_insurer_exposure_by_regency`) with RLS-respecting `security_invoker = true`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/insurer/dashboard` | KPIs, charts series, next up, nudges, hazard watch, products |
| GET | `/api/v1/insurer/portfolio?asset=rice\|cattle` | stats, regency table, concentration note |
| GET | `/api/v1/insurer/portfolio/layers/{layer}` | GeoJSON for insured parcels (simplified), flood extent, rain forecast areas, livestock farms |
| POST | `/api/v1/insurer/nudges/{id}/seen` | `nudge.mark_seen` (writes `nudge.seen`) |

Tools: GET routes use `insurer.read`; `seen` uses `nudge.mark_seen`.

## Map layers

- Insured parcels: centroids as dots at regency zoom (the prototype shows ~120 dots), polygons when zoomed in (maplibre renderer) or schematic regency shapes (schematic renderer).
- Flood extent: the latest per-event union of parcel-level flooded areas plus GFM extent clipped to the insurer's regions, with its acquisition date in the layer label.
- Rain forecast 72 h: official warning areas (feature 09) labelled with the source from the pack.

## UI notes

Follow PLAN i01 and i05 exactly: no count-up on KPI tiles; stacked bar colours from DESIGN.md 2.3 and status tokens; map 560 px; layer chips top-left inside the map; meters fill once.
