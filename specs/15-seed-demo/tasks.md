# 15 Seed and demo: tasks

Fixture files (Phase A) can start on day 1 in parallel with feature 01; the story script follows each service as it lands.

## Phase A: fixtures (data only)

- [ ] **T-15.01** Transcribe PLAN 2.1–2.12 into `seed/fixtures/*.yaml` with `synthetic: true` notes for anything PLAN does not state. FR-15.1. Done when: a validation script checks every figure in the gold-assertion table against the fixtures.
- [ ] **T-15.02** [P] Policy clause templates and PDF generator, including the ACA hidden text and wrong-record cases. FR-15.2.
- [ ] **T-15.03** [P] Parcel polygon generator and committed GeoJSON. FR-15.3.
- [ ] **T-15.04** [P] Photo generator with metadata and the pHash distance assertion. FR-15.4.
- [ ] **T-15.05** [P] Compiled record fixtures (`records/*.yaml`) validating against `policy-record.schema.json`.

## Phase B: story and volume

- [ ] **T-15.06** `story.py` steps through `covered` using services from 04, 06, 07, 08, 12. FR-15.5.
- [ ] **T-15.07** Risk calibration script and fixtures. FR-15.7. Done when: Curation through the real code reproduces PLAN 2.6 to the rupiah.
- [ ] **T-15.08** Story steps through `admin-day` using 09, 10 (fixture mode), 11, 12, 14. FR-15.5.
- [ ] **T-15.09** Background generator. FR-15.6.
- [ ] **T-15.10** Checkpoints and `make demo-checkpoint`, `make demo-reset`. FR-15.8, FR-15.10.
- [ ] **T-15.11** Demo accounts and the `/dev` account switcher. FR-15.9.

## Phase C: verification

- [ ] **T-15.12** `make seed` runs the gold assertions at the end and fails loudly on any mismatch. US-15.3.
