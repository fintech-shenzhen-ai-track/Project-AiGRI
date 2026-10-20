# Lifecycles, domain events and Audit Log actions

State machines are enforced in code (`purchase/`, `claims/`, `compiler/`), never by the UI. Any transition not in a table below is rejected with `409 invalid_transition` and logged. "Actor" says who may cause the transition; "Tier" is the gateway tier of the call that causes it.

## Purchase lifecycle (owner: 08)

Pill words (DESIGN.md 9.6): Draft · Awaiting confirmation · Premium paid · Underwriting · Issued · Declined · Active · Expired · Cancelled.

| From | To | Actor | Tier | Condition and side effects |
| --- | --- | --- | --- | --- |
| — | `draft` | agent | 1 | Agent drafts the purchase packet from a quote. Audit `purchase.drafted` |
| `draft` | `awaiting_confirmation` | system | 0 | Packet frozen and hashed; shown to the Client |
| `awaiting_confirmation` | `draft` | client | — | Client changes parcels or method; the old hash is void |
| `awaiting_confirmation` | `premium_paid` | client | 2 | Client confirms with the matching `packet_hash` and consent box. Code posts premium Client Wallet → escrow (D-16). Audit `purchase.confirmed`, `wallet.premium_posted`. Outbox `purchase.premium_paid` |
| `premium_paid` | `issued` | system | 0 | Inside Issuance Limits. Code creates the Policy, posts escrow → Insurer Wallet. Audit `policy.issued`. Outbox `policy.issued` |
| `premium_paid` | `underwriting` | system | 0 | Outside limits. Audit `purchase.sent_to_underwriting`. Outbox `purchase.underwriting_needed` |
| `underwriting` | `issued` | underwriter_adjuster | 3 | Person accepts. Same effects as above |
| `underwriting` | `declined` | underwriter_adjuster | 3 | Person declines with a reason. Code refunds escrow → Client Wallet. Audit `purchase.declined`, `wallet.refund_posted` |

Policy states (on `policies.state`): `issued` → `active` on `period_start` (job), `active` → `expired` after `period_end` (job). `cancelled` is reserved (D-25).

## Claim lifecycle (owner: 11)

Pill words: Draft · Awaiting confirmation · Submitted · Pre-checked · Under review · Info requested · Approved · Denied · Paid · Appeal draft.

| From | To | Actor | Tier | Condition and side effects |
| --- | --- | --- | --- | --- |
| — | `draft` | agent | 1 | A Loss Event touches a covered asset and the Client says it was affected, or the Client reports a loss. Packet built (assets, Damage Assessments, photos, documents). Audit `claim.packet_drafted` |
| `draft` | `awaiting_confirmation` | system | 0 | Packet frozen and hashed |
| `awaiting_confirmation` | `draft` | client | — | Client adds photos or removes an asset; new packet version |
| `awaiting_confirmation` | `submitted` | client | 2 | Matching `packet_hash` and the truth box. Audit `claim.confirmed`. Outbox `claim.submitted` |
| `submitted` | `prechecked` | agent | 0 | Completeness pre-check and Proposed Amount (rules engine) written as drafts. Audit `claim.prechecked` |
| `prechecked` | `under_review` | underwriter_adjuster | 3 | Adjuster opens it for review. Audit `claim.review_started` |
| `under_review` | `info_requested` | underwriter_adjuster | 3 | Message sent (the agent may draft it). Settlement timer paused. Audit `claim.info_requested` |
| `info_requested` | `draft` | system | 0 | Client opens the request; a resubmission packet version starts |
| `under_review` | `approved` | underwriter_adjuster | 3 | Final amount set; any line changed from the proposal needs a reason. Approval bound to the current `packet_hash`. Audit `claim.approved`. Outbox `claim.approved` |
| `under_review` | `denied` | underwriter_adjuster | 3 | Reason code and message required. Audit `claim.denied`. Outbox `claim.denied` |
| `approved` | `paid` | wallet | 3 (code only) | Wallet consumer of `claim.approved` posts the Payout once (idempotency key `payout:<claim_id>`). Audit `payout.executed`. Outbox `payout.executed` |
| `denied` | `appeal_draft` | agent | 1 | Automatic appeal draft (D-18). Audit `claim.appeal_drafted` |
| `paid` | `appeal_draft` | agent | 1 | Only when the Client asks |
| `appeal_draft` | `awaiting_confirmation` | system | 0 | Appeal packet frozen and hashed; then the normal confirm gate |

Rules that hold in every state:

- No transition closes a Claim because of low confidence, `not_detected` or a failed check. Only `denied` closes one, and only a person causes it.
- Packets are immutable once confirmed. A change creates a new packet version that needs a new confirmation.
- Notice deadline = the Policy Record `deadlines.notice_of_loss` rule applied to the Loss Event (`window_end` for "after the event ends"). Settlement due = the Policy Record settlement rule applied to `packet_complete_at`; paused while `info_requested`.

## Policy Record lifecycle (owner: 04)

| From | To | Actor | Tier |
| --- | --- | --- | --- |
| — | `compiling` | product_manager (upload) | 3 for the upload; compile is agent Tier 0 |
| `compiling` | `needs_review` or `ready` | agent | 0 (`needs_review` if any field is flagged) |
| `needs_review` | `ready` | product_manager | 3 (every flag resolved; settlement window present, D-17) |
| `ready` | `published` | product_manager | 3 (Issuance Limits set). Audit `policy_record.published` |
| `published` | `retired` | product_manager | 3 |
| any unpublished | `held` | superadmin | 3 (a03 "Hold from ranking"; unpublished records are never ranked anyway) |

## Insurer onboarding (owner: 14)

`verification` → `live` (superadmin, Tier 3, only when every verification step is done: licence documents, data processing agreement, tenant isolated, roles assigned, funding account verified, wallet pre-funded to the minimum, first Policy Record reviewed) → `paused` (superadmin).

## Domain events (outbox topics)

Published from the transactional outbox (`outbox` table) by the worker. Consumers must be idempotent.

| Topic | Payload (ids are UUIDs) | Consumers |
| --- | --- | --- |
| `policy_record.published` | record_id, record_key, version, insurer_id | curation (refresh candidates) |
| `purchase.premium_paid` | purchase_id | purchase (issue or route to underwriting) |
| `purchase.underwriting_needed` | purchase_id, insurer_id | nudges (age rule, D-21) |
| `policy.issued` | policy_id, client_id, insurer_id | notifications, hazard (watch assets) |
| `loss_event.updated` | loss_event_id, status | damage (run assessments), claims (offer drafts), alerts |
| `alert.raised` | alert_id, client_id | notifications |
| `damage_assessment.written` | assessment_id, asset_id, loss_event_id | claims (refresh draft) |
| `claim.submitted` | claim_id, packet_id | claims pre-check |
| `claim.approved` | claim_id, decision_id, final_amount_minor, currency, audit_seq | wallet (payout) |
| `claim.denied` | claim_id, decision_id | claims (appeal draft), notifications |
| `payout.executed` | payout_txn_id, claim_id | claims (state `paid`), notifications |
| `nudge.sent` | nudge_id, insurer_id | insurer dashboard |

## Audit Log action names

Dotted, past tense, `object.verb`. The list below is the minimum; features may add more in the same style and must list them in their plan.

`auth.signed_in`, `auth.signed_out`, `membership.granted`, `membership.revoked`, `insurer.created`, `insurer.verification_step_done`, `insurer.went_live`, `client.created`, `consent.given`, `parcel.created`, `parcel.updated`, `ear_tag.registered`, `file.captured`, `policy_record.uploaded`, `policy_record.compiled`, `policy_record.field_reviewed`, `policy_record.published`, `policy_record.held`, `risk.computed`, `curation.ran`, `purchase.drafted`, `purchase.confirmed`, `purchase.sent_to_underwriting`, `purchase.declined`, `policy.issued`, `policy.activated`, `policy.expired`, `hazard.ingested`, `loss_event.created`, `alert.sent`, `damage_assessment.written`, `claim.packet_drafted`, `claim.confirmed`, `claim.prechecked`, `claim.review_started`, `claim.info_requested`, `claim.approved`, `claim.denied`, `claim.appeal_drafted`, `wallet.created`, `wallet.top_up`, `wallet.premium_posted`, `wallet.escrow_released`, `wallet.refund_posted`, `payout.executed`, `wallet.withdrawal`, `wallet.funded`, `payout_account.changed`, `nudge.drafted`, `nudge.sent`, `nudge.seen`, `dispute.opened`, `dispute.resolved`, `agent.call`, `gateway.denied`, `audit.chain_verified`, `ranking.audited`, `admin.viewed`, `clock.moved` (demo only).

Every `agent.call` entry records: tool name, tier, model name and version, input capability tags, output schema name, and whether validation passed. It never records raw untrusted text; it records the file id and hash instead.
