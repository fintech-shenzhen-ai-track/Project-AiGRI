# Orchestrator log

Run settings: SCOPE = lane A (01, 05, 02, 12, 04, 10, 08, 15, 16) · MAX_IMPLEMENTERS = 3 · MAX_FIX_ROUNDS = 2 · PAUSE_AT = every-merge · MERGE_MODE = local. Started 2026-10-20.

## Pause summary (2026-10-20, after 01 A finish, 16 T-16.01, 05 A)

Paused (PAUSE_AT = every-merge). Merged into `lane/a`: 01 A finish (T-01.03), 16 T-16.01 (C24), 05 phase A (C06); `make lint`, `REQUIRE_DB=1 make test` and `make bench` green on `lane/a`. Lane PR #4 open to `main` (needs developer B's review; the orchestrator never approves it). Update: 02 phase A (C07) was finished, reviewed (one fix round) and merged during the pause; nothing is running. Needs a person: (1) disk space for Docker (root disk 2.4 GiB free) so `make up` can run, which is all that stands between us and C01/T-01.02; (2) review PR #4; (3) confirm defaults R-005, R-009, R-013–R-018 (and older R-001–R-003, R-007, R-008); R-004 has no default and blocks 04 phase B. Next on resume: 01 phase B (T-01.05–T-01.14), 05 phase B, and once `make up` is healthy a small work order to tick T-01.02 and C01.

## Pause summary (2026-10-20, update: Docker running, usage limit reached)

Docker is up. Only the compose `db` service runs (from the main checkout). `make up` fails: the `minio/minio` image is no longer pullable (R-005). `REQUIRE_DB=1 make test` on main: 10 passed against the compose db, reached at the host LAN IP because a native Postgres holds 127.0.0.1:5432: `TEST_ADMIN_URL=postgresql://aigri_owner:aigri_owner@192.168.1.94:5432/postgres REQUIRE_DB=1 make test` (the IP may change). T-01.03's Done when passes on main; T-01.02 still fails. C01 stays unticked. Next on resume: dispatch 01 phase B (T-01.05–T-01.14; first commit ticks T-01.03; T-01.13 storage stays open on R-005; use the TEST_ADMIN_URL above; pyproject already has hypothesis and jsonschema) and 05 phase A (T-05.01–T-05.02; gold tests marked xfail(strict=True) so main stays green; local copies of the core.money/core.hashing interfaces until 01 B merges; no pyproject edits). Their paths do not overlap.

## Pause summary (2026-10-20, after merging 01 phase A)

Paused because PAUSE_AT = every-merge. 01 phase A's code is merged (`e8d86f3`); `make lint` and `make test` pass on main, but the 4 DB tests and the frontend checks are skipped. C01 is NOT ticked: T-01.02 (`make up` healthy) and T-01.03 (`alembic upgrade head`, app role cannot UPDATE `audit_events`) have never run because the Docker daemon is down. Nothing else is dispatched until `make up` and `REQUIRE_DB=1 make test` pass on main. Needs a person: start Docker, install pnpm, resolve the port 5432 clash, and confirm or answer R-001–R-004.

## Status

Wave 1, before M1. Docker restarts while developer A retries moving its disk image (still on `/`, 4.1 GiB free); compose `db` restarted by hand after each. Merged today: 01 A finish, 16 T-16.01 (C24), 05 A (C06), 02 A (C07), 05 B (C16), 01 B part 1 (hashing, clock, money, packs). 05 swap merged. 05 C and 01 B part 2 merged. 12 A merged (C08). Running: 04 A (C13), 01 C (C03). 12 B blocked on R-023/R-024 (person). C01 waits on `make up`; T-01.10 (C02) waits on R-007. Lane PR #4 open.

## Running

- 04 phase A (T-04.01–T-04.03, C13) · `feat/04-policy-compiler-pa` · new worktree · 2026-10-20 · `record_clauses` without `embedding` until R-004
- 01 phase C (T-01.15–T-01.18, C03; T-01.18 needs a PR run to tick) · `feat/01-foundation-pc` · new worktree · 2026-10-20

## Merged

- 12 phase A · `fea564b` + alembic merge revision `merge_0012` (heads `0001_ids`, `0012_wallet`) · ticked T-12.01–T-12.03 (Done when re-run on lane/a with the DB: 318 passed incl. RLS harness on the four wallet tables) · C08 delivered. Two fix rounds (txn status + payout shape, tenant columns from the wallet row, currency from packs, no superadmin claim; then payouts must name insurer and client, no NULL escape). Phase B waits on R-023, R-024 (person); payout parties must come from the claim record (R-029).
- 01 phase B part 2 · `93d638c` · ticked T-01.06, T-01.11, T-01.12, T-01.14 (Done when re-run on lane/a with the DB: 293 passed; single head `0001_ids`) · no board contract; no fix round. Phase B done except T-01.10 (R-007, person) and T-01.13 (MinIO, needs `make up`). `core.audit.export_rows(from_ts, to_ts)` is sync (asyncio.run), `fetch_rows`, `write_export`, `verify`; outbox consumers register via `outbox.register` or `CONSUMER_MODULES`; new unpoliced tables go in `core/rls_check.NO_POLICY_ALLOWLIST`.
- 05 phase C · `39138a6` · ticked T-05.11 (Done when re-run on lane/a: 251 passed; coverage gate `backend/tests/test_rules_coverage_gate.py` enforces 100% branches on `aigri/rules`; reviewer proved it fails at 97%) · one fix round (per_policy assessed-% monotonicity). T-05.12 stays with the accounting teammate. `pytest-cov` dev dep per R-022 (a). Note: `.coverage` is not in `.gitignore` (01 owns it).
- 05 swap onto real core · `b4927bd` · no tasks · `rules/_compat.py` deleted; rules keep `_numeric.py` (`round_half_up`, `parse_pct`) and weekday `add_days` as rules logic; float guard before `core.hashing.jcs`. 210 passed on lane/a. No fix round.
- 01 phase B part 1 · `2588bb2` · ticked T-01.05, T-01.07, T-01.08, T-01.09 (Done when re-run on lane/a with the DB: 210 passed; reviewer planted a `datetime.now()` and the ban test failed) · no board contract. No fix round. R-007 interim (b) in code (`core/packs.py` `_compact_decimals`); BPS region codes verified, unchanged. T-01.10 waits on R-007; T-01.13 needs MinIO.
- 05 phase B · `b56deb6` · ticked T-05.03–T-05.10 (Done when re-run on lane/a with the DB: 124 passed, no xfail; hero gold 190.400.000 / 187.800.000) · C16 delivered. No fix round. Reviewer: R-015 (a) matches FR-05.7/FR-05.8; business days Mon–Fri without holidays follows FR-05.4 (holidays are roadmap); `expected_payout` rounds per class then once at the end, so T-15.07 calibration must use this same function. Leftover: unused `not_built` helper in `backend/tests/rules/records.py`.
- 02 phase A · `574ce93` · ticked T-02.01–T-02.03 (Done when re-run on lane/a: parity and router-graph tests pass, 60 passed) · C07 delivered. One fix round (feature 14 tools moved from `core/` to `nudges/tools.py`; resolver owner is 01 T-01.15; `fastapi>=0.151`). Route code uses `Annotated[Authorized, Depends(gate("x"))]` or `dependencies=[...]` (ruff B008).
- 05 phase A · `2b1e269` · ticked T-05.01, T-05.02 (Done when re-run on lane/a: 29 passed, 56 xfailed strict for phase B) · C06 delivered. Two fix rounds (invented fixture texts; product names, synthetic AUTS/K scheme rule id `SYNTHETIC scheme rule (AUTS/K)` to replace if a spec gives a real one). Phase B must drop the xfail markers and switch `rules_fn` lazy imports to real ones.
- 16 T-16.01 · `a5784b6` · ticked T-16.01 (Done when re-run on lane/a: `make bench` wrote a results folder, 9 suites "not run", audit "not available") · C24 delivered (board `a8dce42`). One fix round (`datetime.now` fallback). Feature 16's later tasks (T-16.02+) reuse branch `feat/16-bench-pall`.
- 01 phase A finish · `8549343` · ticked T-01.03 (Done when re-run on lane/a: migration tests pass) · T-01.02 compose fix merged (MinIO from source, R-005 (a); portals env, R-009 (a)) but T-01.02 stays open until `make up` is healthy · C01 not ticked. Reviewer risks for the live run: `go install minio@RELEASE…` tag resolution unproven (fallback: git clone + go build), long build, disk use.
- Sync: `origin/main` (PR #3, lane B 03 phase B, C05) into `lane/a` 2026-10-20; lint and tests green.
- Lane PR #2 (lane B: 03 phase A, C04) merged into `main` 2026-10-20; synced into `lane/a`.
- Lane PR #1 (lane A: 01 phase A, C01 pending) merged into `main` 2026-10-20.
- 01 phase A · `e8d86f3` · ticked T-01.01, T-01.04 (T-01.02, T-01.03 open: need `make up` and `REQUIRE_DB=1 make test` on main) · C01 not yet confirmed. One fix round (T-01.02 was ticked on `docker compose config` only).

## Fakes to swap

- 12 `wallet/fakes.py` `RecordingAudit` (`AuditPort.write(action, object_type, object_id, payload, client_id, insurer_id)`) → `core.audit.append` · ready to dispatch (12 A merged)
- 16 `bench/audit_chain.py` audit source + local hashing → `core.audit.export_rows`/`fetch_rows`/`write_export` and `core.hashing.jcs`/`entry_hash` (both now merged) · ready to dispatch
- Swap notes for `rules/_compat.py` (from the 01 B review): `canonical_json` → `core.hashing.jcs` (byte-identical except: `jcs` accepts floats, so keep a float guard in `rules/`; `jcs` rejects ints from 2**53 with `rfc8785.IntegerDomainError`, adjust any `except ValueError`); money `round_minor` same for IDR/PHP/THB, `core.money` raises PackNotFound for undefined currencies and needs packs loaded; `round_half_up`, `parse_pct` have no core equivalent (keep in rules/ or add); check `core.packs` exposes time zone / local date helpers. `bench/audit_chain.py` `canonical_json` uses `json.dumps(sort_keys=True)`, differs from RFC 8785, switch to `core.hashing.jcs` + `entry_hash` (with the audit swap after T-01.06).
- actor resolver · `backend/aigri/gateway/actor.py` default fails closed (401) · 01 T-01.15 (C03) must call `install_actor_resolver` with its session lookup
- `gateway.denied` Audit Log entry not written · `gateway/authorize.py` · T-02.04 (02 phase B) after T-01.06
- ~~rules `_compat.py`~~ swapped (merged b4927bd)
- `core.audit.export` · `bench/audit_chain.py` `UnavailableSource`/`FakeAuditSource` (16) · swap when T-01.06 merges; needs `export_rows(from_ts, to_ts)` or adapter change
- `core.hashing` · `bench/audit_chain.py` local `canonical_json`/`entry_hash`/`verify_rows` (16) · swap when T-01.05 merges, delete the copy

## Blocked

- 12 phase B (T-12.04–T-12.06) · waits on a person for R-023 (posting privilege) and R-024 (forgeable approval row) · since 2026-10-20
- T-01.02 live check (`make up`) · host root disk has 2.4 GiB free; Docker failed with an I/O error writing the 2.6 GB Ollama layer · since 2026-10-20
- C01 confirmation (T-01.02) · R-005 (MinIO image); being fixed by 01 A finish · since 2026-10-20

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

- Disk space for Docker · developer A · host `/` has 2.4 GiB free (Docker Desktop's disk lives there); free space or move Docker's disk image to `/Volumes/RolfStuffs` (50 GiB free). The Ollama image plus `qwen3` models need well over 10 GB. Unblocks T-01.02 and C01.
- R-005 MinIO image · developer A · confirm default (a) (build from source, applied in 01 A finish) or pick another option
- Model size · developer A · machine has 16 GB RAM; D-10 suggests `LLM_MODEL=qwen3:8b` in `.env` on small machines (not changed by the orchestrator)
- A native Postgres (not this project's) listens on localhost:5432 · developer A · stop it or remap the compose `db` port, so `make up` and the test DB work
- Node is v26, AGENTS.md says Node 24 LTS · developer A · install Node 24 if the pin matters (pnpm 12.14 now installed; frontend checks run)
- T-15.01 fixture transcription (money tables) · accounting teammate · `seed/fixtures/*.yaml` written and reviewed
- T-15.02 policy clause texts · PolSci teammate · `seed/policies/*.md`
- T-05.12 counterfactual cases · accounting teammate · `bench/suites/counterfactual/cases/`
- T-04.17 Policy Q&A gold set · PolSci teammate · `bench/suites/policy_qa/cases/`
- T-07.16 curation arithmetic check · accounting teammate · lane B (out of scope this run)
- T-09.03 BMKG access check · developer B + PolSci · lane B (out of scope this run)
- T-11.17 claim scenario gold · accounting + PolSci · lane B (out of scope this run)
- R-001 insurer wallet balances · team + accounting · confirm default (b) or pick another option

## Raised

- R-029 · 11's `claim.approved` audit row sets insurer_id/client_id; default (a) yes (lane B)
- R-028 · audit chain limits (tail truncation, forged row, high-seq DoS); default (a) anchor + forged-insert test
- R-027 · `uuid7` uses real time; default (a) documented exception
- R-026 · RLS allowlist additions incl. `outbox`; default (a) payloads id-only
- R-025 · 12 schema additions vs data-model.md; default (a) keep and update the shared file (person)
- R-024 · payout trigger trusts an `audit_events` row the app role can INSERT; needs a person
- R-023 · wallet posting privilege; default (3) SECURITY DEFINER posting functions; needs a person before 12 B
- R-022 · `pytest-cov` dev dependency for the 05 coverage gate in 01's pyproject; default (a) 05 adds it
- R-021 · 01 pack schema not in the backend image; default (a) pydantic mirror fallback
- R-020 · 05 per-asset deductible on a total-loss line; default (a) applies
- R-019 · 05 `per_policy` franchise/deductible formula; default (a) keep, teammate review
- R-018 · 02 role mapping of "Person roles" cells; default (a) as encoded in the parity test
- R-017 · 02 placement of cross-cutting tools incl. `clock.move` in `nudges/tools.py`; default (a) keep
- R-016 · 05 synthetic Sinar Mas event dates in a deadline test; default (a) keep, replace from seed
- R-015 · 05 `expected_payout` signature and `fit` 4-decimal string; default (a) keep, confirm at T-05.09
- R-014 · 05 `loss_categories` shape for AUTP/AUTS/K; default (a) keep fixture shape
- R-013 · 16 tests in `backend/tests/bench/` outside 16's owned paths; default (a) allow it
- R-009 · (lane B) portals service needs `API_INTERNAL_URL` and `SANDBOX`; default (a) applied in 01 A finish
- R-008 · (lane B) format-cases.json wire shape; default (a) `{id, kind, pack, args[], expected}`; tell 01 phase B (T-01.10)
- R-007 · (lane B) compact-money decimals in pack schema; default (a) edits `specs/00-shared/schemas/country-pack.schema.json` (team file); needs a person before T-01.10
- R-006 · (lane B) `middleware.ts` vs `proxy.ts`; lane B
- R-005 · `minio/minio` image not pullable, `make up` fails; default (a): build MinIO from source

- R-004 · pgvector missing from `postgis/postgis:16-3.4` for `record_clauses.embedding`; no default; decide before 04 Phase B
- R-003 · identity tables without tenant policy, allowlisted in T-01.11 (default a)
- R-002 · no RLS policy on `audit_events`, reads via audited views (default a)
- R-001 · insurer wallet balances computed by the ledger (pre-existing, default (b), open)
