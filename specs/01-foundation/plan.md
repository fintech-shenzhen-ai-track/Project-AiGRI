# 01 Foundation: plan

## Owns

See `specs/00-shared/ownership.md` row 01.

## Stack decisions

| Concern | Choice |
| --- | --- |
| Python | 3.12, `uv`, `ruff`, `mypy --strict` on `core/` |
| Web framework | FastAPI, Pydantic v2 models (they double as JSON schemas for the quarantined reader) |
| ORM and migrations | SQLAlchemy 2.0 (async engine with `asyncpg`), GeoAlchemy2, Alembic |
| Database | `postgis/postgis:16-3.4` image or newer 16.x |
| Settings | `pydantic-settings` |
| Scheduler and outbox | APScheduler in the `worker` service (D-32) |
| Object storage | MinIO (D-33), `boto3`/`aioboto3` client |
| Canonical JSON | a maintained RFC 8785 library, pinned |
| Test | `pytest`, `pytest-asyncio`, `hypothesis`, `testcontainers` or the CI PostGIS service |

## Layout

```
backend/aigri/core/
  config.py        Settings (env), SANDBOX flag, model names, thresholds
  db.py            engine, tenant_session() context manager (SET LOCAL ...)
  rls.sql          policies, applied by migration 0001
  clock.py         now(), set_story_now(), mode
  packs.py         load, validate, Pack model, formatters (fmt.money etc.)
  money.py         Money dataclass (Decimal + currency), to_minor/from_minor, round per D-37
  hashing.py       jcs(), sha256_payload(), constant-time compare
  audit.py         append(), verify(), export()
  outbox.py        emit(), consumer registry
  storage.py       put_file(), get_stream(), presign (internal only)
  auth.py          otp issue/verify, sessions, current_actor dependency
  ids.py           UUIDv7, human ids (D-35) with per-year sequences
  seed_loader.py   extension point used by feature 15
backend/aigri/api/app.py         FastAPI app, middleware (request id, tenant), error handler
backend/aigri/api/routers/auth.py, packs.py, jobs.py, health.py, dev.py (sandbox only)
backend/aigri/workers/runner.py  APScheduler + outbox publisher loop + job runner
mock_services/sms/, mock_services/email/   tiny FastAPI apps with SQLite storage
```

## RLS

Migration 0001 creates roles `aigri_owner` (owns tables, used by Alembic) and `aigri_app` (used by the API and worker; `NOINHERIT`, no `BYPASSRLS`). For each tenant table:

```sql
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims FORCE ROW LEVEL SECURITY;
CREATE POLICY insurer_isolation ON claims
  USING (
    current_setting('app.role', true) = 'superadmin'
    OR insurer_id = nullif(current_setting('app.insurer_id', true), '')::uuid
    OR client_id  = nullif(current_setting('app.client_id', true), '')::uuid
  );
```

Each owning feature adds the policy for its tables in its own migration using a helper `apply_tenant_policy(table, insurer_col='insurer_id', client_col='client_id')` defined here. Workers act as `app.role = 'system'` with an explicit tenant set per job; a job that spans tenants sets the tenant per item.

Tests (`tests/core/test_rls.py`): for every table that has an `insurer_id` column, insert rows for two insurers, open an insurer-A session, and assert zero rows of insurer B come back from `SELECT *`, from joins, and from the `insurer_covered_assets` view. The test discovers tables from the catalog, so new tables are covered automatically.

## Auth endpoints

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/otp` | `{destination}` | `202`; code sent via mock SMS/email |
| POST | `/api/v1/auth/verify` | `{destination, code}` | `200 {memberships:[...]}` and session cookie (pending membership choice if several) |
| POST | `/api/v1/auth/membership` | `{membership_id}` | `200 {actor}` |
| GET | `/api/v1/auth/me` | — | `{user, membership, role, client?, insurer?, pack_code}` |
| POST | `/api/v1/auth/sign-out` | — | `204` |
| GET | `/api/v1/auth/demo-accounts` | — | Sandbox only: the four demo identities (c01) |
| POST | `/api/v1/auth/demo-sign-in` | `{account_key}` | Sandbox only: signs in directly; writes `auth.signed_in` with `demo: true` |

## Clock endpoints (sandbox only)

`GET /api/v1/dev/clock`, `POST /api/v1/dev/clock {mode, story_now}` (Superadmin role or demo scripts with `DEV_TOKEN`).

## Formatters

Python (`core.packs.fmt`) and TypeScript (`portals/lib/pack/format.ts`, owned by 03 but specified here) must produce identical strings. A shared fixture `specs/01-foundation/format-cases.json` (task T-01.10 creates it from DESIGN.md 11 examples) is run by both test suites. Money: `Intl.NumberFormat(locale, {maximumFractionDigits: display_decimals})` digits plus the pack symbol prefix with no space (never `style: 'currency'`, which inserts a space after "Rp"), U+2212 for negatives.

## Config keys

`DATABASE_URL`, `DATABASE_OWNER_URL`, `SANDBOX`, `CLOCK_MODE`, `DEFAULT_PACK=ID`, `SESSION_SECRET`, `MINIO_*`, `MOCK_SMS_URL`, `MOCK_EMAIL_URL`, `LLM_PROVIDER=ollama`, `LLM_BASE_URL`, `LLM_MODEL=qwen3:14b`, `LLM_VISION_MODEL=qwen3-vl:8b`, `LLM_FALLBACK_*`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `DEV_TOKEN`, `PHASH_MAX_DISTANCE=8`, `CURATION_THETA=0.50`.

## Risks

- RLS forgotten on a new table: mitigated by the catalog-driven test.
- Clock misuse (`datetime.now()`): a ruff custom rule or grep test bans it outside `core/clock.py`.
- Ollama first pull is slow and large (qwen3:14b is 9,3 GB): README states hardware and lets `qwen3:8b` be chosen in `.env`.
