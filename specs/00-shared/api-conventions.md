# API conventions

The backend is one FastAPI app. FastAPI generates `backend/openapi.json`; `make openapi` exports it and regenerates the TypeScript types in `portals/lib/api/types.ts` (use `openapi-typescript`). The OpenAPI file is the contract between backend and frontend features: when a feature's plan lists an endpoint, the first task of that feature adds it with its request and response models and a stub, so the UI work can start in parallel.

## Shape

- Base path `/api/v1`. Portal-scoped prefixes: `/api/v1/client/...`, `/api/v1/insurer/...`, `/api/v1/admin/...`, plus shared `/api/v1/auth/...`, `/api/v1/capture/...`, `/api/v1/packs/...`.
- JSON in and out. Field names `snake_case`. Money as `{ "amount_minor": 13440000, "currency": "IDR" }`; the client formats it with the pack formatter. Timestamps UTC ISO 8601 with `Z`. Dates as `YYYY-MM-DD`.
- Every response that shows a computed figure also returns its source: clause ids for coverage statements, record and assessment ids for amounts, model and data versions for risk.
- Lists: `?cursor=&limit=` (default 50, max 200); responses `{ "items": [...], "next_cursor": null }`.
- Errors: `{ "error": { "code": "consent_hash_mismatch", "message": "Plain sentence for the user.", "details": {...} } }`. Codes are stable snake_case strings; messages follow DESIGN.md 13 (what happened, what is safe, what to do).
- Idempotency: every POST that creates money movement, a confirmation or a decision accepts `Idempotency-Key`; a repeat with the same key returns the first result.

## Auth and tenancy

- Session cookie (D-34). Each request resolves `user`, `membership`, `role`, `client_id` or `insurer_id`.
- The DB session sets `app.role`, `app.insurer_id`, `app.client_id` with `SET LOCAL` at the start of every transaction (`core.db.tenant_session`). Routes never query without it.
- Every route handler calls `gateway.authorize(tool_name, actor, args)` (through the `gate(...)` dependency) before any service code; plans write "read" for routes that use `client.read`, `insurer.read` or `admin.read`. Route-level role checks are not enough on their own.

## Status codes

`200` read, `201` created, `202` accepted for a background job (returns a job id to poll), `400` validation, `401` no session, `403` role or tier refused, `404` not found or not in your tenant (never reveal which), `409` invalid transition or hash mismatch, `422` schema or capture check failed, `429` rate limited.

## Jobs

Long work (policy compile, Damage Assessment, risk recompute, bench) runs in the worker. Endpoints return `202 { "job_id": "..." }`; `GET /api/v1/jobs/{id}` returns `queued`, `running`, `done` (with a result link) or `failed` (with a user-safe message).

## Versioning

Breaking changes need a decision entry and a new path version; additive changes do not.
