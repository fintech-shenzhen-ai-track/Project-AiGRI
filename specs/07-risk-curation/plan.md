# 07 Risk Model and Curation: plan

## Owns

`backend/aigri/risk/`, `backend/aigri/curation/`, routers `client_risk.py`, `client_cover.py`, migration `0007_*`, `portals/app/client/risk/`, `portals/app/client/cover/` (except `buy/`).

## Risk layout

```
risk/
  inputs/open_meteo.py      forecast, ensemble, historical clients with caching and rate limit
  inputs/history.py         mapped flood events per asset (GFM archive, national records, PhilSA/HDX by pack)
  config/vulnerability/*.yaml, config/class_edges/*.yaml, config/base_rates/*.yaml
  model/flood.py, model/wind.py, model/base_rate.py, model/joint.py (farm-level), model/confidence.py
  run.py                     run_for_asset, run_for_client; writes risk_outputs; input_hash
  tools.py                   risk.compute (Tier 0)
curation/
  formula.py                 VERSION; candidates(), fit_filter(), score(), sort_key()
  reasons.py                 templates → reason items with clauses
  run.py                     run(client) and replay(run_id)
  tools.py                   curation.run (Tier 0)
```

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/client/risk?horizon=season\|d1-16` | farm-level per peril, per-asset bars, sources, "why" texts, rain series |
| GET | `/api/v1/client/cover` | latest Curation run for the Client (runs one if stale > 24 h or inputs changed) |
| GET | `/api/v1/client/cover/compare?records=a,b,c` | compare-sheet rows |
| GET | `/api/v1/client/cover/{record_key}` | c07 detail for the Client's assets |
| GET | `/api/v1/client/insurers/{code}/stats` | median decision days and claims paid on AiGRI (reads 11's view) |
| POST | `/api/v1/admin/curation/{run_id}/replay` | 14 uses it; Superadmin only |

Tools: every GET above uses `client.read`; the replay route uses `ranking.audit` (Superadmin). Curation itself runs as `curation.run` inside the cover read when stale.

## Determinism

- Sorting and scores use `Decimal` with fixed quantisation (4 places) before comparison.
- Input snapshot ordering is canonical (sorted by id); the output is serialised with JCS and hashed.
- The formula version is the git commit of `curation/formula.py` injected at build (`AIGRI_FORMULA_VERSION`), falling back to the semantic version string in dev.

## UI notes

- c05: `.seg` "This season / Next 16 days"; peril cards with pills (High → alert, Moderate → need, Low → ok); bar chart with the top three bars in `--parcel-risk`; mini map; three `Disclosure` items; Sources `.kv`; cream CTA band "Cover that fits this risk" with the one yellow "See ranked policies".
- c06: chips for perils (filter display only; the ranking itself does not change with the chips), policy cards (`PolicyCard`), the not-eligible card, "How the ranking works" disclosure (PLAN c06 item 4 wording), compare sheet, clause sheet, demo note.
- c07: per PLAN c07; on mobile the aside buy card is hidden and a sticky bottom bar holds the one yellow.

## Seed interplay

In demo mode the risk outputs for the hero Client come from fixtures (feature 15), labelled with the reason "fixture data", so that Curation reproduces PLAN 2.6. The live model runs for every non-fixture asset and for the backtests.
