# 11 Claims: plan

## Owns

`backend/aigri/claims/`, routers `client_claims.py`, `insurer_claims.py`, migration `0011_*`, `portals/app/client/claims/`, `portals/app/insurer/claims/`.

## Layout

```
claims/
  drafting.py      build packet from policy, loss event, assessments, photos
  packets.py       versions, freeze, hash (core.hashing)
  submit.py        Tier 2 via gateway
  precheck.py      checks list + rules.propose_amount
  timers.py        notice and settlement due, pause/resume, SLA buckets
  review.py        start review, preview amount, decide, request info
  appeals.py
  consumers.py     loss_event.updated (offer), damage_assessment.written (refresh draft),
                   claim.submitted (precheck), claim.denied (appeal draft), payout.executed (paid)
  stats.py         insurer aggregates for 07
  tools.py
```

## Endpoints

| Method | Path | Tool |
| --- | --- | --- |
| GET | `/api/v1/client/claims` | read |
| GET | `/api/v1/client/claims/{claim_no}` | read (status page payload) |
| GET | `/api/v1/client/claims/{claim_no}/packet` | read (current draft with readings, photos, deadline) |
| PATCH | `/api/v1/client/claims/{claim_no}/packet` | `claim.draft_packet` (include/exclude assets, notes, photo selection) |
| POST | `/api/v1/client/claims/{claim_no}/packet/freeze` | `claim.draft_packet` → `{packet_hash}` |
| POST | `/api/v1/client/claims/{claim_no}/submit` | `claim.submit` (Tier 2) |
| POST | `/api/v1/client/claims/{claim_no}/appeal-draft` | `claim.draft_appeal` |
| GET | `/api/v1/insurer/claims?tab=&event=&asset=&q=` | read |
| GET | `/api/v1/insurer/claims/{claim_no}` | read (review payload incl. pre-check, assessments, photos with checks, consent scope) |
| POST | `/api/v1/insurer/claims/{claim_no}/start-review` | `claim.start_review` |
| POST | `/api/v1/insurer/claims/{claim_no}/preview-amount` | `rules.propose_amount` (read-only compute) |
| POST | `/api/v1/insurer/claims/{claim_no}/info-request-draft` | `claim.draft_info_request` |
| POST | `/api/v1/insurer/claims/{claim_no}/info-request` | `claim.request_info` |
| POST | `/api/v1/insurer/claims/{claim_no}/decision` | `claim.decide` with `Idempotency-Key` |
| GET | `/api/v1/client/insurers/{code}/stats` | read; served by 07 from `stats.py` |

## SLA buckets

`due_48h`: settlement due within 48 hours of `clock.now()`; `over`: past due and not decided; `paused`: info requested. Computed in SQL from `settlement_due_at` and `paused_since` so the queue sorts fast.

## UI notes

- c11: page head with `.pill-pending` "Awaiting your confirmation"; need banner with deadline; static stepper (Evidence done, Your check current, Confirm, Adjuster decides) and the caption "Asuransi Jasindo's adjuster decides. AiGRI never decides a claim." (insurer name from data); event `.kv`; tabs per parcel with `SatelliteCompare` and readings; all-parcels table without money; photo grid (8 shown + "Show all"); consent card with hash and truth checkbox; the single yellow "Confirm and submit claim"; modal with `.btn-ink` "Submit".
- i04: `.split` with sticky decision panel (top 88 px); loss % inputs 72 px wide with `%` affix; reason field reveals with the accordion pattern when first required; approve `.btn-y.btn-lg.btn-block`; request info `.btn-soft`; deny `.btn-danger`; modals and sheets per PLAN i04; after approval the action stack is replaced by a `.card-ink` summary.
- i03: `.table-tools` with tabs, chips and search; rows open the review page.
- c12: per PLAN c12, with the count-up only when the claim just turned paid in this session.
- Every claim page in sandbox mode with fixture assessments shows the demo note (D-05).
