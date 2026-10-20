# AGENTS.md: how coding agents work in this repo

AiGRI is a multi-insurer agricultural insurance platform: a FastAPI backend with PostgreSQL + PostGIS, an Ollama-backed agent behind a permission gateway, and one Next.js PWA with three portals (Client, Insurer, Superadmin). Indonesia is the launch market. This repo is built spec first.

## 1. Read before you write anything

Read these, in this order, before your first change in a session:

1. `.specify/memory/constitution.md`: the rules no code may break.
2. `specs/00-shared/roadmap.md`: the features, their order and which can run in parallel.
3. `specs/00-shared/decisions.md`: resolved conflicts and the defaults to use for open questions.
   Then `specs/00-shared/ownership.md` (your feature's lane, A or B) and `handoff/contracts-board.md` (which contracts you wait for and which you owe).
4. The `spec.md`, `plan.md` and `tasks.md` of the feature you were assigned, plus every file under `specs/00-shared/` that its plan links to.
5. For any UI task: `DESIGN.md`, then the matching prototype page in `system-preview/` (open it in a browser; it is the visual reference).

Source material, read-only: `docs/source/technical-brief-v2.md` (the brief), `docs/source/settled-decisions-2026-10-20.md`, `system-preview/PLAN.md` (screen-by-screen content and the demo data), `design-system/`, `wireframe/`, `brand/`, `landing-preview/`. Do not edit these. If they disagree with a spec, the spec wins, and if a spec seems wrong, raise it (section 6).

## 2. How to pick up work

- Work one task at a time from your feature's `tasks.md`, in order, except tasks marked `[P]`, which can run in parallel with the other `[P]` tasks in the same phase.
- Each task names the requirement IDs it satisfies (for example `FR-11.4`). Do not build anything that no task asks for.
- Mark a task done (`- [x]`) in the same commit that completes it, and only when its "Done when" checks pass.
- Branch per feature: `feat/NN-short-name`. Commit messages: `NN: T-NN.MM short description`.
- Merge your feature's Phase A (the contract) first and tick its row in `handoff/contracts-board.md` in the same pull request.
- Stay inside the paths your feature's plan lists under "Owns". Changing a path another feature owns needs a note in `specs/00-shared/decisions.md` under "Raised by agents" first.

## 3. Repository layout

```
AGENTS.md  CLAUDE.md  HANDOFF.md  Makefile  docker-compose.yml  .env.example
.specify/memory/constitution.md
specs/00-shared/            roadmap, decisions, data model, events, API rules, hashing, JSON schemas
specs/NN-feature/           spec.md, plan.md, tasks.md (one folder per feature)
backend/
  pyproject.toml
  aigri/
    core/        config, db session + RLS context, clock, packs, money, auth, audit log, outbox, storage
    gateway/     tool registry, tiers, capability tags, consent-hash gate
    agent/       LLM provider adapter, quarantined reader, planner, prompts
    compiler/    Policy Compiler and self-check
    rules/       deterministic rules engine
    risk/        Risk Model
    curation/    ranking
    hazard/      GDACS, BMKG, Open-Meteo ingest, Loss Events, alerts
    damage/      Damage Assessment (Sentinel-1/2, GFM), photo and Ear Tag checks
    assets/      clients, parcels, livestock, Ear Tags, Capture Page uploads
    purchase/    quotes, purchase lifecycle, underwriting, policies
    claims/      claim lifecycle, packets, pre-check, decisions, appeals
    wallet/      ledger, payout trigger (talks to mock_services/wallet)
    nudges/      rule-based and drafted Nudges, disputes
    api/         FastAPI app and routers (thin; logic lives in the modules above)
    workers/     scheduler and outbox consumers
  migrations/    Alembic
  tests/
packs/          ID.yaml (live), PH.yaml, VN.yaml, TH.yaml (planned)
portals/        Next.js PWA: app/client, app/insurer, app/admin, app/capture, app/(marketing)
mock_services/  wallet/, sms/, email/, adjuster_bot/
seed/           synthetic demo fixtures and loader
bench/          AiGRI-Bench suites, gold answers, results/
docs/           generated deliverables (architecture, security self-assessment, deployment)
```

The brief lists the backend modules at the repo root. They live under `backend/aigri/` here so they form one Python package (decision D-03).

## 4. Commands

| Command | What it does |
| --- | --- |
| `make up` | `docker compose up`: Postgres + PostGIS, Ollama (pulls the configured models on first run), API, worker, PWA, mock services |
| `make seed` | Loads the synthetic demo data (`seed/`) and sets the demo clock |
| `make demo-reset` | Drops and reloads the demo data, resets the Audit Log chain for the demo tenant set |
| `make test` | Backend `pytest` (unit + integration against a test database) and frontend unit tests |
| `make e2e` | Playwright against the running stack at 390 and 1280 widths |
| `make lint` | `ruff`, `mypy` (strict for `rules/`, `curation/`, `wallet/`, `gateway/`, `core/`), `eslint`, `tsc --noEmit`, the design lint (section 5) |
| `make openapi` | Exports `backend/openapi.json` and regenerates `portals/lib/api/types.ts` |
| `make bench` | Runs every AiGRI-Bench suite; writes `bench/results/<run-id>/` |

Tooling: Python 3.12 with `uv`; Node 24 LTS with `pnpm`; current stable Next.js with the App Router and TypeScript strict. Pin exact versions in lockfiles; do not upgrade majors without a decision entry.

## 5. Rules that CI enforces

Backend:
- Every API route goes through `gateway.authorize(...)` via `gate("<tool>")`; read routes use `client.read`, `insurer.read` or `admin.read`. Only the routes listed as exempt in `specs/00-shared/tools-and-tiers.md` skip it. A test fails otherwise.
- No module outside `wallet/` writes ledger rows. No module outside `core/audit` writes `audit_events`.
- Money is `Decimal` in Python and an integer in the database (minor units, `amount_minor`). Never `float` for money.
- Time comes from `core.clock.now()`, never `datetime.now()`, so the demo clock works.
- Formatting of money, numbers, dates and areas comes from `core.packs` (backend) or `lib/pack` (frontend).

Frontend (design lint, a script in `portals/scripts/design-lint.mjs`):
- No `vh`, `vw`, `svh`, `dvh`, `lvh`; no `border:` or `border-*` except `border:0`; no `outline:` except the focus ring; no `dashed`, `backdrop-filter`, `ease-in` (alone), `scale(0)`, `transition: all`.
- No literal "Rp", "PHP", "IDR", " ha", "WIB", "OJK", "BI-FAST" in component code.
- No string "AiGRI approved", "auto-approved", "AI decided" anywhere.
- At most one `btn-y` rendered per route or open dialog (checked in Playwright).

## 6. When the spec is unclear

1. Look for a default in `specs/00-shared/decisions.md`. Use it and say so in your commit.
2. If there is none, add an entry under "Raised by agents" with the question, the options and your proposed default, then continue only with tasks that do not depend on it.
3. Never invent product scope, insurer names, regulations or numbers. Demo figures come only from `specs/15-seed-demo/`.

## 7. Definition of done for any task

- Its "Done when" checks pass locally and in CI.
- New behaviour has tests; money, ranking, hashing, tiers and tenancy have property or table tests.
- Required Audit Log entries are written and asserted in tests.
- `make lint` is clean. `make openapi` is re-run if the API changed, and the generated types are committed.
- UI tasks: matches the `system-preview/` reference at 1280 (and 390 for client screens), passes axe with no serious issues, works with `prefers-reduced-motion`, and reads completely with the story data.
