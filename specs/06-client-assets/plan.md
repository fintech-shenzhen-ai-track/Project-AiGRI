# 06 Client onboarding and assets: plan

## Owns

`backend/aigri/assets/`, routers `client_onboarding.py`, `client_assets.py`, `capture.py`, migration `0006_*`, `portals/app/client/onboarding/`, `portals/app/client/farm/`, `portals/app/capture/`.

## Endpoints

| Method | Path | Tool | Notes |
| --- | --- | --- | --- |
| GET/PUT | `/api/v1/client/onboarding` | `asset.edit` | step state; PUT per step |
| POST | `/api/v1/client/onboarding/finish` | `asset.edit` | creates wallet (calls 12), platform-terms consent record |
| GET | `/api/v1/client/parcels` | read | list with status and policy pill |
| POST/PATCH/DELETE | `/api/v1/client/parcels[/{id}]` | `asset.edit` | GeoJSON geometry in, area out |
| GET/POST/PATCH | `/api/v1/client/livestock-groups[/{id}]` | `asset.edit` | |
| POST | `/api/v1/client/livestock-groups/{id}/tags` | `asset.edit` | requires a captured tag photo file id |
| GET | `/api/v1/client/livestock-groups/{id}/tags` | read | table of animals |
| POST | `/api/v1/client/capture-sessions` | `evidence.capture` | `{purpose, targets}` → `{token, url, expires_at}` |
| GET | `/api/v1/capture/{token}` | `capture.read_session` | purpose, targets (codes, names), check-list copy |
| POST | `/api/v1/capture/{token}/photos` (multipart) | `evidence.capture` | file + `{lat, lon, accuracy_m, device_time, client_sha256, asset_id}` |
| GET | `/api/v1/client/requests` | read | open retake or info requests for the banner (c04) |

## Geometry

- Store `MultiPolygon` 4326; compute area with `ST_Area(ST_Transform(geom, utm_srid))` where `utm_srid` comes from the centroid longitude (south hemisphere zones for Indonesia, e.g. EPSG:32749 for Demak).
- Validate with `ST_IsValid` and size limits; snap to 6 decimals.
- Location checks in SQL: `ST_DWithin(geom::geography, photo_point::geography, least(accuracy_m, 100))`.

## Capture Page

- Route `/capture/[token]` is outside the portal shell (no tab bar), works without sign-in by token, is mobile-first, and keeps the token out of logs (path parameter hashed in access logs).
- Flow: permission prompts with plain explanations → viewfinder (ink rounded frame, corner guides; for tags the target tag number) → take photo → compute SHA-256 (Web Crypto) → read GPS → show the chip → upload or queue → tick "Saved" with the ok tick pop.
- Image handling: upload the original bytes; resizing for display happens server side. Do not re-encode in the browser (the hash must match the stored bytes).
- Queue: IndexedDB store `capture-queue` managed by the service worker (`sync` event where supported, else retry on `online` and on page load).

## UI notes

- c02 uses `<Flow>` with 4 steps; static default for the demo seed is step 3 with 1–2 done (seed data), but production starts at step 1.
- c03: `.split` map + tiles, details card (desktop) or sheet (mobile); "Draw a parcel" enables Terra Draw polygon mode with the toast "Click the map to place corners. Double-click to finish."; "See my risk" is the one yellow.
- c04: the need banner appears only when an open retake request exists; Animals table uses stack mode on mobile; flagged row tint for animals needing action.

## Perceptual hash

Computed by the API after upload (`ImageHash.phash`), compared against existing evidence photos with a BK-tree or a Postgres `bit(64)` column and Hamming distance; near-duplicates write a flag for feature 10's checks.
