# Orchestrator log

Run settings: SCOPE = lane A (01, 05, 02, 12, 04, 10, 08, 15, 16) · MAX_IMPLEMENTERS = 3 · MAX_FIX_ROUNDS = 2 · PAUSE_AT = every-merge · MERGE_MODE = local. Started 2026-10-20.

## Pause summary (2026-10-20, after merging 01 phase A)

Paused because PAUSE_AT = every-merge. 01 phase A's code is merged (`e8d86f3`); `make lint` and `make test` pass on main, but the 4 DB tests and the frontend checks are skipped. C01 is NOT ticked: T-01.02 (`make up` healthy) and T-01.03 (`alembic upgrade head`, app role cannot UPDATE `audit_events`) have never run because the Docker daemon is down. Nothing else is dispatched until `make up` and `REQUIRE_DB=1 make test` pass on main. Needs a person: start Docker, install pnpm, resolve the port 5432 clash, and confirm or answer R-001–R-004.

## Status

Wave 0, before M1. Nothing running. 01 phase A merged with T-01.02 and T-01.03 open (Docker down). Next once main is verified with the stack: 01 phase B and 05 phase A in parallel (05 A depends only on 01 A), then 16 (bench runner, C24) as a third slot.

## Running

(none)

## Merged

- 01 phase A · `e8d86f3` · ticked T-01.01, T-01.04 (T-01.02, T-01.03 open: need `make up` and `REQUIRE_DB=1 make test` on main) · C01 not yet confirmed. One fix round (T-01.02 was ticked on `docker compose config` only).

## Fakes to swap

(none)

## Blocked

- C01 confirmation (T-01.02, T-01.03) · Docker daemon down; first commit of 01 phase B ticks them once the orchestrator's checks pass on main · since 2026-10-20

## Queue (lane A, in priority order once C01 is confirmed)

01 B → 01 C → 01 D · 05 A → 05 B → 05 C · 02 A → 02 B → 02 C → 02 D · 12 A → 12 B → 12 C → 12 D · 04 A → … · 10 A → … · 08 A → … · 15 A → 15 B → 15 C · 16 all.
Lane B contracts this lane needs will not be built in this run (out of scope): C04/C05 (03 UI shell, needed by the UI phases 12 C, 04 C, 08 C), C09, C10 (06), C18 (09), C20 (07), C22 (11).

## Notes for later work orders (from the 01 phase A review)

- Primary keys default to `gen_random_uuid()` (v4); data-model.md says UUIDv7. Tell 01 phase B (T-01.14 `core.ids`) to supply v7.
- `audit_events` TRUNCATE trigger blocks the owner too; feature 15's `demo-reset` and T-01.17 must reset the chain by dropping/recreating the DB or a dedicated path.
- T-01.11 catalog RLS test needs an allowlist for `audit_events` and `memberships` (R-002, R-003).
- `apply_tenant_policy` has no `system` role branch; worker inserts into `notifications`/`push_subscriptions` need `app.user_id` (T-01.11, T-01.12).
- Production needs: pre-provisioned PostGIS extension, overrides for the sandbox role passwords in 0001.
- Router registry: add one string to `ROUTER_MODULES` in `backend/aigri/api/routers/__init__.py`; module exposes `router`, mounted under `/api/v1`. Migrations: `down_revision = "0001_core"` (or the latest merged head). RLS helper: `aigri.core.rls.apply_tenant_policy`. Test DB: `tests/conftest.py` `test_db` fixture via `TEST_ADMIN_URL`; `REQUIRE_DB=1` makes missing DB a failure.
- Placeholders to replace, not build on: `portals/` (03), `mock_services/wallet/app.py` (12), worker `runner.py` heartbeat stub (T-01.12).

## Waiting on people

- Docker daemon not running · developer A · start Docker Desktop (blocks `make up`, T-01.02, T-01.03, C01, and every later work order)
- A native Postgres (not this project's) listens on localhost:5432 · developer A · stop it or remap the compose `db` port, so `make up` and the test DB work
- `pnpm` not installed (Node is v26, AGENTS.md says Node 24 LTS) · developer A · install pnpm (and Node 24 if the pin matters); until then the frontend halves of `make lint`, `make test`, `make openapi` are skipped
- T-15.01 fixture transcription (money tables) · accounting teammate · `seed/fixtures/*.yaml` written and reviewed
- T-15.02 policy clause texts · PolSci teammate · `seed/policies/*.md`
- T-05.12 counterfactual cases · accounting teammate · `bench/suites/counterfactual/cases/`
- T-04.17 Policy Q&A gold set · PolSci teammate · `bench/suites/policy_qa/cases/`
- T-07.16 curation arithmetic check · accounting teammate · lane B (out of scope this run)
- T-09.03 BMKG access check · developer B + PolSci · lane B (out of scope this run)
- T-11.17 claim scenario gold · accounting + PolSci · lane B (out of scope this run)
- R-001 insurer wallet balances · team + accounting · confirm default (b) or pick another option

## Raised

- R-004 · pgvector missing from `postgis/postgis:16-3.4` for `record_clauses.embedding`; no default; decide before 04 Phase B
- R-003 · identity tables without tenant policy, allowlisted in T-01.11 (default a)
- R-002 · no RLS policy on `audit_events`, reads via audited views (default a)
- R-001 · insurer wallet balances computed by the ledger (pre-existing, default (b), open)
