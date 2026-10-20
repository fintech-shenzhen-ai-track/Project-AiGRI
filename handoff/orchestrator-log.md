# Orchestrator log

Run settings: SCOPE = lane A (01, 05, 02, 12, 04, 10, 08, 15, 16) · MAX_IMPLEMENTERS = 3 · MAX_FIX_ROUNDS = 2 · PAUSE_AT = every-merge · MERGE_MODE = local. Started 2026-10-20.

## Status

Wave 0, before M1. 01 phase A (C01) is running alone; nothing else starts until it is merged and `main` is green. Environment: the Docker daemon was not running at start and `pnpm` is not installed, so `make up`, the Postgres-backed checks and the portals lint cannot pass yet (see "Waiting on people").

## Running

- 01 phase A (T-01.01–T-01.04) · `feat/01-foundation-pa` · worktree: (from report) · started 2026-10-20

## Merged

(none)

## Fakes to swap

(none)

## Blocked

(none)

## Queue (lane A, in priority order once 01 phase A is merged)

01 B → 01 C → 01 D · 05 A → 05 B → 05 C · 02 A → 02 B → 02 C → 02 D · 12 A → 12 B → 12 C → 12 D · 04 A → … · 10 A → … · 08 A → … · 15 A → 15 B → 15 C · 16 all.
Lane B contracts this lane needs will not be built in this run (out of scope): C04/C05 (03 UI shell, needed by the UI phases 12 C, 04 C, 08 C), C09, C10 (06), C18 (09), C20 (07), C22 (11).

## Waiting on people

- Docker daemon not running on the build machine · developer A · start Docker Desktop (needed for `make up`, `make test` against Postgres, T-01.02/T-01.03 checks)
- `pnpm` not installed (Node is v26, AGENTS.md says Node 24 LTS) · developer A · install pnpm (and Node 24 if the pin matters) so `make lint`/`make test` cover `portals/`
- T-15.01 fixture transcription (money tables) · accounting teammate · `seed/fixtures/*.yaml` written and reviewed
- T-15.02 policy clause texts · PolSci teammate · `seed/policies/*.md`
- T-05.12 counterfactual cases · accounting teammate · `bench/suites/counterfactual/cases/`
- T-04.17 Policy Q&A gold set · PolSci teammate · `bench/suites/policy_qa/cases/`
- T-07.16 curation arithmetic check · accounting teammate · lane B (out of scope this run)
- T-09.03 BMKG access check · developer B + PolSci · lane B (out of scope this run)
- T-11.17 claim scenario gold · accounting + PolSci · lane B (out of scope this run)
- R-001 insurer wallet balances · team + accounting · confirm default (b) or pick another option

## Raised

- R-001 · insurer wallet balances computed by the ledger (pre-existing, default (b), open)
