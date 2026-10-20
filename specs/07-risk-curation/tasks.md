# 07 Risk Model and Curation: tasks

Depends on 04 (published records), 05 (expected payout, fit), 06 (assets), 15 (fixtures).

## Phase A: contracts

- [ ] **T-07.01** Migration `0007` (`risk_outputs`, `curation_runs`, `forecast_snapshots`).
- [ ] **T-07.02** Endpoints and models with stubs; OpenAPI regenerated.

## Phase B: Risk Model

- [ ] **T-07.03** Open-Meteo clients (forecast, ensemble, historical) with caching, rate limit and attribution (CC BY 4.0). FR-07.7.
- [ ] **T-07.04** [P] Flood history per asset from mapped events (ID: GFM archive and national records; PH: PhilSA/HDX). FR-07.7.
- [ ] **T-07.05** [P] Config tables (vulnerability, class edges, base rates) with source notes and version strings. FR-07.6, FR-07.3.
- [ ] **T-07.06** Flood model (short and season), wind model, base-rate model, confidence and band. FR-07.2–FR-07.4. Test first with synthetic ensembles.
- [ ] **T-07.07** Joint farm-level probability. FR-07.5. Done when: a test with perfectly correlated parcels gives the max parcel probability and independent parcels give 1 − Π(1 − p).
- [ ] **T-07.08** Risk runner, triggers and `risk.compute` tool. FR-07.1.

## Phase C: Curation

- [ ] **T-07.09** Candidates and eligibility. FR-07.8.
- [ ] **T-07.10** Fit filter, score, sort with tie-breaks, using rules engine. FR-07.9, FR-07.10. Test first with the PLAN 2.6 gold.
- [ ] **T-07.11** Reasons templates with clauses. FR-07.11.
- [ ] **T-07.12** Run records, replay and the no-placement-input test. FR-07.12–FR-07.15.

## Phase D: UI

- [ ] **T-07.13** c05 risk screen. US-07.1.
- [ ] **T-07.14** c06 ranked policies with compare and clause sheets. US-07.2.
- [ ] **T-07.15** c07 policy detail (uses 04's Q&A component). US-07.3, FR-07.16.

## Phase E: bench

- [ ] **T-07.16** Curation suite profiles and gold rankings (accounting teammate checks the arithmetic).
- [ ] **T-07.17** Red-team ranking manipulation: inflate a record field and a hidden "rank first" instruction; ranking must follow the formula.
