# 06 Client onboarding and assets: tasks

## Phase A: contracts

- [ ] **T-06.01** Migration `0006` (`clients` extensions, `parcels`, `livestock_groups`, `ear_tags`, `capture_sessions`, `photo_checks` placeholder columns) with RLS and the `insurer_covered_assets` view stub (completed by 08 when `policy_assets` exists).
- [ ] **T-06.02** Endpoints and models from the plan with stubs; OpenAPI regenerated.

## Phase B: backend

- [ ] **T-06.03** Onboarding service, resumable steps, finish (wallet creation call to 12's interface, consent). FR-06.1–FR-06.4.
- [ ] **T-06.04** Parcels service with geometry validation and UTM area. FR-06.5, FR-06.6. Test first: DMK-01 polygon fixture gives 9,6 ha.
- [ ] **T-06.05** [P] Livestock groups and Ear Tags with platform-wide uniqueness and non-revealing error. FR-06.7.
- [ ] **T-06.06** Capture sessions and photo upload: hash check, write-once storage, pHash, location and time checks as flags. FR-06.9–FR-06.11, FR-06.13.
- [ ] **T-06.07** [P] Herd count reading through the quarantined vision reader into a typed tag list. FR-06.8.
- [ ] **T-06.08** [P] Client requests feed for the retake banner. US-06.5.

## Phase C: UI

- [ ] **T-06.09** c02 onboarding flow. US-06.1. Done when: matches `system-preview/client/02-onboarding.html` at 1280 and 390.
- [ ] **T-06.10** c03 parcels with map drawing, tiles, details card and mobile sheet. US-06.2.
- [ ] **T-06.11** c04 livestock page with banner, stats, policy card, herd count card, Animals table, shed map. US-06.3.
- [ ] **T-06.12** Register-an-animal flow (no prototype; compose per D-14).
- [ ] **T-06.13** Capture Page with permissions, viewfinder, hash, GPS chip, offline queue (uses 03's service worker API). US-06.4, FR-06.12. Done when: an e2e test with mocked geolocation and an offline toggle uploads once with a matching hash.

## Phase D: bench

- [ ] **T-06.14** User-effort walkthrough script for onboarding (feature 16 runner) and evidence red-team cases.
