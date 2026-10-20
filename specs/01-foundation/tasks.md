# 01 Foundation: tasks

Legend: `[P]` can run in parallel with other `[P]` tasks in the same phase. Each task lists the requirements it satisfies and its "Done when" check.

## Phase A: contracts (merge first; other features start after this phase)

- [x] **T-01.01** Monorepo skeleton: `backend/` (uv project), `portals/` placeholder, `mock_services/`, `packs/` (files already present), `seed/`, `bench/`, `Makefile` with all targets (bench stub). FR-01.1. Done when: `make lint` and `make test` run green on the empty skeleton.
- [ ] **T-01.02** `docker-compose.yml` with all services and health checks; `.env.example` documenting every key in plan "Config keys". FR-01.2, FR-01.3. Done when: `make up` brings every container to healthy (portals can serve a placeholder page).
- [x] **T-01.03** Alembic setup with owner and app roles; migration `0001_core` creating identity, platform-core tables from `data-model.md` and the `apply_tenant_policy` helper. FR-01.7, FR-01.8. Done when: `alembic upgrade head` on an empty DB succeeds and `aigri_app` cannot `UPDATE audit_events`.
- [x] **T-01.04** API app shell: error format, request id, `GET /api/v1/health`, router registry file. FR-01.15, API conventions. Done when: `make openapi` produces `openapi.json` with the health route.

## Phase B: core services

- [x] **T-01.05** `core.hashing` with RFC 8785 test vectors and `sha256_payload`. Test first. Done when: RFC vectors pass; property test shows key order does not change the hash.
- [x] **T-01.06** `core.audit.append/verify/export` with advisory-lock serialisation and the UPDATE/DELETE trigger. FR-01.11. Test first. Done when: 1.000 concurrent appends produce a valid chain; tampering is detected at the right `seq`.
- [x] **T-01.07** [P] `core.clock` real and demo modes; ban `datetime.now()` outside it (lint test). FR-01.9.
- [x] **T-01.08** [P] `core.money` (Decimal, minor units, D-37 rounding, D-38 exponent) with table tests.
- [x] **T-01.09** [P] `core.packs`: load, validate, serve; formatters. Verify the ID region codes against BPS and correct `packs/ID.yaml` if needed (note the source in a comment). FR-01.10.
- [ ] **T-01.10** [P] `specs/01-foundation/format-cases.json` from DESIGN.md section 11 (at least 30 cases across kinds) and the Python formatter tests that read it. Done when: every case passes.
- [x] **T-01.11** `core.db.tenant_session` and the catalog-driven RLS test harness. FR-01.7, FR-01.8. Done when: the harness passes on the 0001 tables and fails if a policy is dropped.
- [ ] **T-01.12** `core.outbox` + worker publisher with retries and dead-letter. FR-01.12. Done when: a crash between commit and publish still delivers exactly once to an idempotent consumer in tests.
- [ ] **T-01.13** [P] `core.storage` on MinIO with SHA-256 on write, no overwrite. FR-01.13.
- [ ] **T-01.14** [P] `core.ids` human id sequences (D-35) per insurer code and year, gap-free under concurrency.

## Phase C: auth and sandbox

- [ ] **T-01.15** OTP issue and verify, rate limits, sessions, membership choice, `/auth/me`. FR-01.4–FR-01.6. Done when: integration tests cover expiry, attempts, rate limit, revocation, and a user with two memberships.
- [ ] **T-01.16** Mock SMS and email services plus `/dev/inbox` API (sandbox only). FR-01.14.
- [ ] **T-01.17** Demo accounts endpoints and clock endpoints, both refused when `SANDBOX=false`. US-01.2, US-01.4.
- [ ] **T-01.18** CI workflow. FR-01.16. Done when: a pull request shows all jobs green.

## Phase D: hardening

- [ ] **T-01.19** Load test the read path on seeded data (after feature 15 fixtures exist); record p95 in `docs/perf.md`.
- [ ] **T-01.20** Red-team cases for this layer added to `bench/suites/red_team/cases/`: cross-tenant id guessing, session replay after sign-out, demo endpoints with `SANDBOX=false`.
