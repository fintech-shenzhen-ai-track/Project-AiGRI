# 04 Policy Compiler and Policy Q&A: tasks

Depends on 01, 02 (quarantined reader), 03 (components), 05 (types only), and 15's seeded policy PDFs for golden tests.

## Phase A: contracts

- [ ] **T-04.01** Pydantic section models matching `policy-record.schema.json` with a round-trip parity test. FR-04.6.
- [ ] **T-04.02** Migration `0004` for `policy_records`, `record_field_reviews`, `record_clauses`, `injection_findings` with RLS; `published_records` view.
- [ ] **T-04.03** Endpoints from the plan with request/response models and stubs; regenerate OpenAPI types.

## Phase B: compile pipeline

- [ ] **T-04.04** PDF extraction with pages, offsets, font size and colour. FR-04.3.
- [ ] **T-04.05** Clause segmentation into `record_clauses`. FR-04.4.
- [ ] **T-04.06** [P] Injection scan (hidden text, tiny text, off-page, instruction-like phrases) and exclusion of flagged spans. FR-04.5. Done when: the ACA fixture yields the page-23 finding.
- [ ] **T-04.07** Section-by-section quarantined extraction and assembly with schema validation. FR-04.6.
- [ ] **T-04.08** Clause verification of every filled field. FR-04.7.
- [ ] **T-04.09** [P] Self-check templates and comparator. FR-04.8.
- [ ] **T-04.10** [P] Ambiguity rules including D-07 and D-17. FR-04.9.
- [ ] **T-04.11** Confidence formula and status transition. FR-04.10.
- [ ] **T-04.12** Review, limits, acknowledge, publish services with blockers and versioning. FR-04.12, FR-04.13, FR-04.17. Test first for the blocker list.

## Phase C: UI

- [ ] **T-04.13** `/insurer/products` list.
- [ ] **T-04.14** i02 review screen with PDF clause panel, flags, limits, pre-publish check-list and publish. FR-04.11, US-04.2, US-04.3. Done when: matches `system-preview/insurer/02-publish-policy.html` at 1280.
- [ ] **T-04.15** Clause sheet and `PolicyQA` component for c06 and c07. FR-04.15, FR-04.16.

## Phase D: Q&A and bench

- [ ] **T-04.16** Retrieval (full-text) and answer generation with citation validation and abstention. FR-04.15. Test first with fixtures.
- [ ] **T-04.17** Policy Q&A bench suite: 25–30 questions over the 8 demo records with gold clause ids and at least 5 unanswerable questions; gold answers checked by the PolSci teammate.
- [ ] **T-04.18** Red-team ASI01 and ASI06 cases.
