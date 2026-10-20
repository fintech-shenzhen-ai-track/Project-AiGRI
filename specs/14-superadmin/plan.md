# 14 Superadmin and Nudges: plan

## Owns

`backend/aigri/nudges/`, routers `admin_overview.py`, `admin_insurers.py`, `admin_quality.py`, `admin_disputes.py`, `admin_packs.py`, `admin_audit.py`, migration `0014_*` (`nudge_rules`, `nudges`, `disputes`, `system_health`, `ranking_audits`), `portals/app/admin/*` route folders.

## Layout

```
nudges/
  rules.py         the four rule evaluators (SQL over claims, records, purchases)
  scheduler.py     registers daily 09:00 pack-time jobs (D-29)
  drafting.py      nudge.draft through the agent drafting runtime with typed facts
  send.py          nudge.send (code for rules, person for free text)
  disputes.py
  health.py        writers called by workers and the health endpoint
  ranking_audit.py sample + curation.replay + anomaly.flag
  onboarding.py    insurer verification steps, go live
  tools.py
```

## Admin data access

Superadmin sessions set `app.role = 'superadmin'`. Cross-tenant reads go through views that return aggregates or operational records (claims metadata, nudges, disputes, records) and never client contact details beyond what a page shows. Every admin read of a dispute's appeal text writes an Audit Log entry (`admin.viewed`, added to the action list).

## Endpoints

| Method | Path | Tool |
| --- | --- | --- |
| GET | `/api/v1/admin/overview` | read |
| GET | `/api/v1/admin/insurers` and `/{id}` | read |
| POST | `/api/v1/admin/insurers` | `insurer.create` (from pack roster code) |
| POST | `/api/v1/admin/insurers/{id}/steps/{step}` | `insurer.complete_step` |
| POST | `/api/v1/admin/insurers/{id}/go-live` | `insurer.go_live` |
| POST/DELETE | `/api/v1/admin/insurers/{id}/memberships[/{mid}]` | `membership.grant` / `membership.revoke` |
| GET | `/api/v1/admin/quality` and `/records/{id}` | read |
| POST | `/api/v1/admin/quality/audit` | `ranking.audit` (`202` job) |
| POST | `/api/v1/admin/records/{id}/hold` | `policy_record.hold` |
| GET | `/api/v1/admin/sla` | read |
| GET | `/api/v1/admin/nudges` | read |
| POST | `/api/v1/admin/nudges/draft` | `nudge.draft` |
| POST | `/api/v1/admin/nudges/{id}/send` | `nudge.send` |
| GET/PUT | `/api/v1/admin/nudge-rules[/{code}]` | `admin.read` / `nudge.set_rule` |
| GET | `/api/v1/admin/disputes` and `/{id}` | read |
| POST | `/api/v1/admin/disputes/{id}/remind` and `/resolve` | `nudge.send` / `dispute.resolve` |
| POST | `/api/v1/client/claims/{claim_no}/disputes` | `dispute.open` (Client) |
| GET | `/api/v1/admin/packs` | read |
| GET | `/api/v1/admin/audit?actor=&from=&to=&q=&cursor=` | read |
| GET | `/api/v1/admin/audit/{seq}` | read |
| POST | `/api/v1/admin/audit/verify` | `audit.verify_chain` |

## UI notes

Follow PLAN a01–a06 exactly (funnel, meters, health list, nudge composer with `.pill-info` "Drafted by AiGRI", disabled "Mark ACA as live" with "2 steps left", injected-instruction banner with "OWASP ASI01: goal hijack", pack cards with meters, audit table rows that never animate, event sheet with mono payload).
