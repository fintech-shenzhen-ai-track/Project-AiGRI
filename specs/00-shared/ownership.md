# Path ownership

Two developers own the features in lanes (details in `handoff/DEV-A.md` and `handoff/DEV-B.md`): **A, Platform, trust and money** (01, 02, 04, 05, 08, 10, 12, 15, 16) and **B, Journeys and portals** (03, 06, 07, 09, 11, 13, 14, 17, 18). Contracts between lanes are tracked in `handoff/contracts-board.md`.

Parallel agents stay out of each other's way by owning paths. A feature may read anything, but writes only to its own paths and to the shared files through the owner's documented extension point.

| Feature | Lane | Owns (write) |
| --- | --- | --- |
| 01 Foundation | A | `Makefile`, `docker-compose.yml`, `.env.example`, `.github/workflows/`, `backend/pyproject.toml`, `backend/aigri/core/`, `backend/aigri/api/app.py`, `backend/aigri/api/routers/auth.py`, `backend/aigri/api/routers/packs.py`, `backend/aigri/api/routers/jobs.py`, `backend/aigri/workers/runner.py`, `backend/migrations/env.py`, `backend/migrations/versions/0001_*`, `packs/`, `mock_services/sms/`, `mock_services/email/` |
| 02 Gateway and agent | A | `backend/aigri/gateway/`, `backend/aigri/agent/`, `backend/migrations/versions/0002_*` |
| 03 UI shell | B | `portals/` except the route folders other features own (route table in `specs/03-ui-shell/plan.md`); owns `portals/components/`, `portals/lib/`, `portals/styles/`, `portals/public/`, `portals/scripts/`, `portals/middleware.ts`, `portals/app/layout.tsx`, `portals/app/client/layout.tsx`, `portals/app/insurer/layout.tsx`, `portals/app/admin/layout.tsx`, `portals/app/sign-in/`, `portals/app/client/settings/`, `portals/app/dev/` |
| 04 Policy Compiler | A | `backend/aigri/compiler/`, routers `insurer_products.py`, `client_policy_qa.py`, migrations `0004_*`, `portals/app/insurer/products/` |
| 05 Rules engine | A | `backend/aigri/rules/` |
| 06 Client assets | B | `backend/aigri/assets/`, routers `client_onboarding.py`, `client_assets.py`, `capture.py`, migrations `0006_*`, `portals/app/client/onboarding/`, `portals/app/client/farm/`, `portals/app/capture/` |
| 07 Risk and Curation | B | `backend/aigri/risk/`, `backend/aigri/curation/`, routers `client_risk.py`, `client_cover.py`, migrations `0007_*`, `portals/app/client/risk/`, `portals/app/client/cover/` (except `buy/`) |
| 08 Purchase | A | `backend/aigri/purchase/`, routers `client_purchase.py`, `insurer_underwriting.py`, migrations `0008_*`, `portals/app/client/cover/buy/`, `portals/app/insurer/underwriting/` |
| 09 Hazards and alerts | B | `backend/aigri/hazard/`, routers `client_home.py`, `client_alerts.py`, migrations `0009_*`, `portals/app/client/home/`, `portals/app/client/alerts/` |
| 10 Damage Assessment | A | `backend/aigri/damage/`, migrations `0010_*` |
| 11 Claims | B | `backend/aigri/claims/`, routers `client_claims.py`, `insurer_claims.py`, migrations `0011_*`, `portals/app/client/claims/`, `portals/app/insurer/claims/` |
| 12 Wallet | A | `backend/aigri/wallet/`, `mock_services/wallet/`, routers `client_wallet.py`, `insurer_wallet.py`, migrations `0012_*`, `portals/app/client/wallet/`, `portals/app/insurer/wallet/` |
| 13 Insurer views | B | routers `insurer_dashboard.py`, `insurer_portfolio.py`, migration `0013_*` (views only), `portals/app/insurer/dashboard/`, `portals/app/insurer/portfolio/` |
| 14 Superadmin | B | `backend/aigri/nudges/`, routers `admin_*.py`, migrations `0014_*`, `portals/app/admin/` route folders |
| 15 Seed and demo | A | `seed/`, `backend/aigri/core/seed_loader.py` (extension point registered by 01), `scripts/demo/` |
| 16 Bench | A | `bench/`, `mock_services/adjuster_bot/` |
| 17 Landing | B | `portals/app/(marketing)/` |
| 18 Deliverables | B | `docs/` (except `docs/source/`, which is read-only) |

## Shared files and their extension points

| Shared thing | Owner | How others extend it |
| --- | --- | --- |
| Router registration | 01 | Each feature adds one line to `backend/aigri/api/routers/__init__.py` in its first task; merge conflicts there are resolved by keeping all lines |
| Migration chain | 01 | Revision files are numbered by feature (`0006_assets_*.py`). Each feature's first revision sets `down_revision` to the latest merged head; run `alembic merge heads` if two land together |
| Tool registry | 02 | Each feature registers its tools in its own module (`<module>/tools.py`) with the tiers listed in `tools-and-tiers.md`; the registry loads them |
| Navigation config | 03 | `portals/lib/nav.ts`; the entries already exist for every planned route (PLAN 4.5), so features never edit it |
| Icons | 03 | `portals/components/icons/sprite.tsx` holds the full PLAN 4.3 list |
| Seed fixtures | 15 | Other features read fixtures; they do not edit them. Ask 15 through "Raised by agents" |
| Bench suites | 16 | Each feature adds its gold cases under `bench/suites/<suite>/cases/` as part of its own tasks (the only exception to ownership, because gold cases travel with the feature) |
