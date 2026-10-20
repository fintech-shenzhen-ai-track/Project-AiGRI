# 09 Hazards, Loss Events and alerts: plan

## Owns

`backend/aigri/hazard/`, routers `client_home.py`, `client_alerts.py`, migration `0009_*` (`hazard_feed_items`, `loss_events`, `alerts`; it reads `forecast_snapshots`, owned by 07), `portals/app/client/home/`, `portals/app/client/alerts/`.

## Layout

```
hazard/
  feeds/gdacs.py        RSS + GeoJSON event list client; parse to typed items
  feeds/bmkg.py         structured feed if available, else page fetch → quarantined reader (HazardWarning schema)
  feeds/pagasa.py       PH pack (planned), same pattern as BMKG page path
  loss_events.py        create/update, area from warning polygons or admin areas
  matching.py           assets ∩ event areas (PostGIS), per Client
  alerts.py             rule evaluation (D-22), content builder, dedupe
  steps/*.yaml          step library per peril × crop/species, versioned
  notify.py             push (pywebpush), SMS and email (mock services)
  affected.py           "Was your farm affected?" prompts and answers
  tools.py              hazard.ingest, alert.send
```

## Scheduling (worker)

| Job | Every | Notes |
| --- | --- | --- |
| `gdacs_poll` | 30 min | |
| `bmkg_poll` | 15 min | respect source terms; back off on errors |
| `alert_evaluate` | after each forecast snapshot or warning | |
| `loss_event_status` | 1 h | ends events when evidence says water receded |

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/client/home` | everything c09 needs in one call |
| GET | `/api/v1/client/alerts` | list |
| GET | `/api/v1/client/alerts/{id}` | c10 payload: event, assets table, forecast series, steps, deadline rules, delivery statuses, sources |
| POST | `/api/v1/client/alerts/{id}/affected` | `{answer: yes|no|not_sure, asset_ids?}` |
| POST | `/api/v1/client/loss-reports` | Client-reported loss: peril, dates, assets |
| POST | `/api/v1/client/push-subscriptions` | Web Push subscription (03 calls it) |

Tools: GET routes use `client.read`; `affected` and `loss-reports` use `loss.report`; `push-subscriptions` uses `notifications.subscribe`.

## UI notes

- c09: no yellow on the page except the logo sun (the action lives on c10). Cards stagger in once. Rain chart uses `--water` bars and the `--alert` 50 mm threshold line labelled with the pack's warning authority from the alert payload (never hard-coded "BMKG").
- c10: `.split` with map (forecast area polygon at 0,25 opacity in `--parcel-risk`, fades in after parcels) and rain card left; "What to do now" numbered card with the one yellow "Take before-photos" right; "If your crop is damaged" card with the clause chip; parcels table; "How you were told" `.kv`.

## Risks

- BMKG access method unverified (D-27). Task T-09.03 confirms it first; if neither a feed nor page parsing is allowed, alerts run on Open-Meteo ensemble thresholds plus GDACS only, and the UI names those sources.
