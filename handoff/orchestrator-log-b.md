# Orchestrator log (lane B)

Run settings: SCOPE = lane B (03, 06, 07, 09, 11, 13, 14, 17, 18) · MAX_IMPLEMENTERS = 3 · MAX_FIX_ROUNDS = 2 · PAUSE_AT = every-merge · LANE_BRANCH = lane/b (created from `origin/main` at `c75b9a4`, 2026-10-20). Lane B runs on its own log here, not in the lane A log.

## Pause summary (2026-10-20, after 03 phase A merge)

03 phase A is merged into `lane/b` (`fb038da`). The reviewer approved with no fixes. `make lint` and `make test` pass on `lane/b` (backend 6 passed, 4 skipped; vitest 137). C04 is ticked. T-03.01–T-03.04 are ticked; T-03.05 is built against a C02 stand-in and left unticked. `lane/b` is pushed and PR #2 (`lane/b` → `main`) is open for developer A to review (C04 is what A waits for); merge only once it is approved and green. Raised R-006–R-009 (all with proposed defaults; R-007–R-009 need lane A's input). Next when resumed: 03 phase B (T-03.06–T-03.14, components = C05). Still waiting on C01 being ticked on `origin/main`; 03 B is frontend only like 03 A, so it needs the same override from the person to start before C01.

## Pause summary (2026-10-20, lane B start: nothing dispatched)

Lane B's ground check is done: `lane/b` exists and is pushed, there are no worktrees and no `feat/*` branches. Docker (daemon running) and GNU make are now installed. Nothing was dispatched: section 10 says lane B's first work order waits until C01 is ticked on `origin/main`, and it is not ticked. Lane A still has T-01.02 (`make up` healthy) open, blocked on R-005 (the `minio/minio` image cannot be pulled). First work order once C01 is ticked: 03 phase A (T-03.01–T-03.05, delivers C04). T-03.04 needs C03 and T-03.05 needs C02 (both from 01, not merged), so it will be built against spec-following fakes and swapped later.

Housekeeping for a person: local `main` has two unpushed commits (`2cdaa31` and merge `8f074e7`) from an earlier lane B start. They write lane B notes into the lane A log (`handoff/orchestrator-log.md` / `-a.md`). Lane B now logs only here. I did not delete those commits; drop them with `git switch main && git reset --hard origin/main` if you agree.

## Status

Wave 0, before M1. 03 phase A merged (C04). Paused (PAUSE_AT = every-merge). Next: 03 phase B (C05). Nothing running. C01 still not ticked on `origin/main`. Waiting for C01 on `origin/main` (lane A, R-005).

## Running

(none)

## Merged

- 03 phase A · `fb038da` · T-03.01, T-03.02, T-03.03, T-03.04 (T-03.05 built, unticked: C02 stand-in) · C04

## Fakes to swap

- C02 `format-cases.json` · `portals/tests/fixtures/format-cases.standin.json` (adapter in `portals/tests/pack-format.test.tsx`; shape per R-008) · swap when C02 merges, then tick T-03.05
- C03 auth endpoints · `portals/lib/api/standin.ts` (`Me`, `Badges`); `portals/lib/pack/types.ts` hand-written from the schema · swap when C03 merges: `make openapi`, alias to generated schemas, delete standin.ts, re-check T-03.03 against real `auth/me`
- Test-only fake API · `portals/e2e/support/fake-api.mjs` · keep for unit e2e; add real-stack runs once C01 is ticked

## Blocked

- (overridden 2026-10-20) 03 phase A gate on C01; dispatched anyway, merged
- PR #2 lane/b → main · waiting for developer A's review · 2026-10-20
- 03 phase B onward: lane gate on C01 (section 10); needs the person's override again or C01 ticked

## Queue (once C01 is ticked)

03 A (C04) → 03 B (C05 components) → 03 C → 03 D · 06 A (C09) once 03 A/01 A allow (needs C07 from 02 A; fake if not merged) → 06 B … · 07 A (C17), 07 C (C20) · 09 A … (C18) · 11 (C22) · 13 · 14 A (C23) · 17 all · 18 all.

## Waiting on people

- (resolved 2026-10-20) Restarted from the `Documents` path; worktrees work
- R-007, R-008, R-009 · developer A · answer when building T-01.10 / fixing compose
- C01 (T-01.02 `make up` healthy) · developer A · resolve R-005 (MinIO image), finish 01 phase A checks, tick C01 on `origin/main`
- Native PostgreSQL services hold localhost:5432 (from the lane A log) · developer A · stop them or remap the compose `db` port
- (resolved 2026-10-20) Docker installed and running; GNU make installed; pnpm 12.14.0, Node v24.10.0
- T-09.03 BMKG access check · developer B + PolSci · access confirmed or fallback chosen (D-27)
- T-07.16 curation arithmetic check · accounting teammate
- T-11.17 claim scenario gold cases · accounting + PolSci
- T-15.01, T-15.02 fixtures (C25, lane A reviews) · accounting, PolSci · needed by 07 and 11 gold tests
- R-001 insurer wallet balances · team + accounting · confirm default (b) (affects 13)

## Raised

- R-006 · keep `middleware.ts` vs rename to `proxy.ts` (Next 16)
- R-007 · compact-money decimals into the pack schema (lane A, T-01.10)
- R-008 · wire shape of `format-cases.json` (lane A confirms)
- R-009 · compose needs `API_INTERNAL_URL` and `SANDBOX` for the portals service (lane A)
- open on main from lane A: R-001–R-005
