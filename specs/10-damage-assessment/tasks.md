# 10 Damage Assessment: tasks

Depends on 02 (quarantined vision reader), 06 (assets, photos), 09 (Loss Events).

## Phase A: contracts

- [ ] **T-10.01** Migration `0010`; Pydantic model for `damage-assessment.schema.json`; `damage.assess` tool registered.
- [ ] **T-10.02** Fixture-mode writer with the hero values and the cattle records, so feature 11 can build on records before the pipeline exists. FR-10.14.

## Phase B: crop pipeline

- [ ] **T-10.03** STAC search, signing, loading and scene cache. FR-10.2.
- [ ] **T-10.04** Sentinel-1 flood mask with permanent water removal and flooded-vegetation flag. FR-10.3. Test with a small synthetic raster.
- [ ] **T-10.05** [P] Duration range. FR-10.4.
- [ ] **T-10.06** [P] Sentinel-2 NDVI with SCL masking and valid share. FR-10.5.
- [ ] **T-10.07** Clipping per Parcel. FR-10.6.
- [ ] **T-10.08** [P] GFM client and national-map ingestion. FR-10.7.
- [ ] **T-10.09** Cross-check, confidence and assessed-loss proposal. FR-10.8–FR-10.10. Test first: each confidence reason lowers one step.
- [ ] **T-10.10** Record writer, hash, events, status rules. FR-10.11, FR-10.12.
- [ ] **T-10.11** [P] Before/after imagery renders with attribution. FR-10.13.

## Phase C: photos and livestock

- [ ] **T-10.12** Per-photo checks. FR-10.15.
- [ ] **T-10.13** Tag reads and livestock checks across insurers (match/no-match only). FR-10.16, FR-10.17.

## Phase D: validation and bench

- [ ] **T-10.14** Validation harness and the Damage Assessment accuracy suite on Demak Feb 2024 and Mar 2024 vs GFM (ID) and Inday vs PhilSA (PH). D-36. Report measured numbers only.
- [ ] **T-10.15** Evidence red-team cases: reused photo, duplicate tag on another insurer's policy, GPS far from the parcel.
