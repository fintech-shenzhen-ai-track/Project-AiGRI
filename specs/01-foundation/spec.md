# 01 Foundation: spec

## Summary

Everything the other features stand on: one command starts the whole stack; people sign in with a one-time code; each person acts in one role inside one tenant; the database itself keeps insurers apart; time can be the real clock or the demo story clock; money, numbers and dates are formatted by the active country pack; and every action lands in a hash-chained Audit Log.

## User stories

**US-01.1 One command.** As a developer or judge, I run `make up` on a machine with Docker and get the full sandbox (database, model server, API, worker, PWA, mock services) with demo data loaded, so I can evaluate AiGRI without setup.
- Given a clean machine with Docker, when I run `make up && make seed`, then `http://localhost:3000` shows the sign-in page and `GET /api/v1/health` returns every component `ok` within 15 minutes on first run (model download excluded from the timing in the README).

**US-01.2 Sign in with a code.** As a Client, Insurer staff member or Superadmin, I sign in with my phone or email and a 6-digit code.
- Given a known phone, when I request a code, then the mock SMS inbox receives it and the code works once within 10 minutes.
- Given 5 wrong codes, then that code is dead and I must request a new one.
- Given `SANDBOX=true`, the sign-in page lists the four demo accounts for one-tap entry (c01).

**US-01.3 One role, one tenant.** As an Insurer staff member, I only ever see my own insurer's data, even if the API has a bug.
- Given I am signed in as Jasindo's adjuster, when I request a claim id that belongs to Sinar Mas, then I get `404` and an RLS test proves the row was never returned by the database.

**US-01.4 Story clock.** As a demo presenter, I can set the platform's "now" to a story date so deadlines, SLAs and alerts behave as on that day.
- Given demo mode and story now 24 Feb 2026, 08:30 WIB, then the insurer topbar shows "Tuesday 24 Feb 2026, 08:30 WIB" and SLA badges compute from that time.

**US-01.5 Country-correct formatting.** As any user, I see money, numbers, areas and dates in my country pack's format.
- Given the ID pack, then 187800000 IDR renders "Rp187.800.000", 48 ha renders "48,0 ha", 3.5% renders "3,5%", a timestamp renders "24 Feb 2026, 14:32 WIB", and a signed ledger amount renders "−Rp13.440.000" with U+2212.

**US-01.6 Tamper-evident log.** As a judge or Superadmin, I can verify that no Audit Log entry was edited or removed.
- Given 1.000 entries, when one entry's payload is changed directly in the database by a superuser, then `verify` reports the first broken `seq`.

## Functional requirements

- **FR-01.1** The repository shall provide `make up`, `make seed`, `make demo-reset`, `make test`, `make e2e`, `make lint`, `make openapi` and `make bench` (bench may be a stub until feature 16).
- **FR-01.2** Docker Compose shall run: `db` (PostgreSQL 16 + PostGIS), `ollama`, `api` (FastAPI), `worker`, `portals` (Next.js), `minio`, `mock-sms`, `mock-email`, `mock-wallet` (placeholder until feature 12). The `ollama` service shall pull `LLM_MODEL` and `LLM_VISION_MODEL` on first start.
- **FR-01.3** Configuration shall come from environment variables documented in `.env.example`, validated at startup (pydantic-settings); the app refuses to start on a missing required value.
- **FR-01.4** Sign-in shall use one-time codes per D-34: 6 digits, hashed at rest, 10-minute expiry, 5 attempts, rate limit 5 requests per destination per hour.
- **FR-01.5** Sessions shall be opaque random tokens (256-bit), stored hashed, in an httpOnly, Secure (except localhost), SameSite=Lax cookie, expiring after 12 hours idle and 7 days absolute; sign-out revokes server side.
- **FR-01.6** Each session shall resolve exactly one membership (role + tenant). A user with several memberships picks one after sign-in.
- **FR-01.7** Every database transaction opened for a request shall set `app.role`, `app.insurer_id`, `app.client_id`, `app.user_id` with `SET LOCAL`. The API database role shall not own tables and shall not have `BYPASSRLS`.
- **FR-01.8** Every insurer-owned table shall have RLS enabled and forced, with policies on `insurer_id`; client-owned tables shall have policies on `client_id`. Superadmin access goes through named views that log reads of client personal data.
- **FR-01.9** `core.clock.now()` shall return UTC; in demo mode it returns the stored story time. Moving the clock writes `clock.moved` and is allowed only when `SANDBOX=true`.
- **FR-01.10** `core.packs` shall load and validate every `packs/*.yaml` against `country-pack.schema.json` at startup, serve them at `GET /api/v1/packs` and `GET /api/v1/packs/{code}`, and expose formatters for money, compact money, number, percent, area, date, datetime, range, coordinates and phone, matching DESIGN.md section 11.
- **FR-01.11** `core.audit.append` shall be the only writer of `audit_events` and implement the chain in `hashing-and-audit.md`. `core.audit.verify` shall recompute a range.
- **FR-01.12** `core.outbox` shall write events in the caller's transaction; the worker shall publish them to registered consumers at least once, in order per topic, with retries and a dead-letter state after 10 attempts.
- **FR-01.13** `core.storage` shall store files in MinIO with a new key per upload, never overwrite, record SHA-256, and stream downloads only after an authorization check.
- **FR-01.14** Mock SMS and mock email services shall accept messages over HTTP, store them, and show them on a sandbox inbox page at `/dev/inbox` (PWA) for demo and testing.
- **FR-01.15** `GET /api/v1/health` shall report each component (db, ollama with models present, minio, worker heartbeat, mock services) and feed `system_health` (feature 14).
- **FR-01.16** CI (GitHub Actions) shall run lint, unit tests, integration tests against a PostGIS service container, schema validation of `specs/00-shared/schemas`, and the RLS and audit-chain tests on every push.

## Non-functional

- Structured JSON logs with request id, user id, role, tenant; no personal data in logs beyond ids.
- API p95 under 300 ms for reads on demo data (excluding model and satellite work).
- All secrets from env; none committed.

## Out of scope

Real SMS and email providers, SSO, password sign-in, multi-region deployment.

## Audit entries written by this feature

`auth.signed_in`, `auth.signed_out`, `membership.granted`, `membership.revoked`, `clock.moved`, `audit.chain_verified`.
