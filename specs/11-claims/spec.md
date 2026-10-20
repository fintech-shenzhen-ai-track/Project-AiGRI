# 11 Claims: spec

## Summary

After a Loss Event, the agent drafts the Claim Packet (affected assets, Damage Assessments, photos, documents). The Client checks it, adds photos if something is missing, and confirms the exact packet (Tier 2). The agent pre-checks it for completeness and the rules engine proposes an amount. The insurer's Adjuster reviews the evidence, asks for more if needed, sets the final amount (with a reason for any change) and approves or denies. Approval triggers the Payout automatically (feature 12). Denial gives the Client a drafted appeal. Deadlines and settlement windows come from the Policy Record. This is Topic D's "claims guidance".

## User stories

**US-11.1 Check and confirm (c11).** As Ibu Sri Wahyuni on 16 Feb 2026, I open "Your flood claim is ready to check": 5 parcels, 40,5 ha; the deadline "Report by 21 Feb 2026 … 5 days left" with Clause 8.1; the event; readings parcel by parcel; my 14 photos; DMK-06 listed as outside the flood and not included with "Add it"; then I tick the truth box and "Confirm and submit claim".
- Given I have not ticked the box, then the submit button is disabled.
- Given I confirm in the modal, then the toast says "Claim submitted. AiGRI's pre-check is running." with "Track it".

**US-11.2 Insurer queue (i03).** As Dimas Prasetyo on 24 Feb 2026, 08:35 WIB, I see 59 claims with tabs All 59 · Open 41 · Due in 48 h 3 · Info requested 5 · Decided 18, each row with status, pre-check result, proposed amount and SLA.

**US-11.3 Review and decide (i04).** As the Adjuster, I see the pre-check list, the damage assessment map and table, before/after per parcel, ground photos with their checks, what I am allowed to see, and a decision panel with the proposed amount per parcel that I can change.
- Given I change DMK-05 from 20% to 15%, then that line shows "Changed from 20%", the total becomes Rp187.800.000 (difference −Rp2.600.000), a reason is required, and the approve button reads "Approve Rp187.800.000".
- Given I approve, then the head pill becomes "Approved", the panel says "Approved by you at 14:30 WIB. Payout PAY-26-00318 sent at 14:32.", and a toast confirms.

**US-11.4 More information loop.** As the Adjuster, I request a ground photo of DMK-05 showing the water line; AiGRI drafts the message, I edit and send. As the Client, I see the request, add 2 photos, and confirm the new packet; the settlement timer paused while it waited on me.

**US-11.5 Track to payout (c12).** As the Client, I see "Paid Rp187.800.000", who approved and when, the full timeline with packet fingerprints, how the amount was set per parcel with the adjuster's change and reason, and how to appeal.

**US-11.6 Denied, not abandoned.** As a Client whose claim was denied (CLM-26-000433, late notice), I see the reason in plain words and a drafted appeal I can edit and confirm.

**US-11.7 Livestock claim.** As Pak Slamet, my claim for 2 cattle (GBG-0485, GBG-0489) is paused for a retake of GBG-0489's tag photo, then resubmitted and approved for Rp20.000.000.

## Functional requirements

- **FR-11.1** One Claim per Policy × Loss Event. Created as `draft` by `claim.draft_packet` (Tier 1) when the Client answers "affected" (feature 09) or reports a loss; claim number per D-35.
- **FR-11.2** The packet (`claim-packet.schema.json`) lists every asset the Policy covers that the Loss Event touched, each with its Damage Assessment id and hash, plus every evidence photo for those assets in the event window and before-photos; assets outside the event are listed with `included: false`. The Client can include or exclude assets and add photos (Capture Page) and notes; any change makes a new packet version.
- **FR-11.3** Notice deadline and days left are shown from the rules engine (Policy Record deadlines + Loss Event dates), with the clause. A Claim past the notice deadline can still be submitted; it is flagged "late" for the Adjuster, never blocked.
- **FR-11.4** Confirm and submit is `claim.submit` (Tier 2) with the packet hash and the truth declaration; writes `claim.confirmed`, emits `claim.submitted`.
- **FR-11.5** Pre-check (`claim.precheck`, Tier 0, drafts only): policy active on the loss date; peril covered (with conditions per FR-05.3); notice on time; assets match insured boundaries; photo checks summary; reused-photo check; Damage Assessment notes (low confidence, not detected); open info requests answered; livestock tag checks. Each line has a status (ok, need, denied-style note) and a sentence and a clause where relevant. The footer says "Pre-check drafts only. It never approves or denies." Proposed Amount from `rules.propose_amount` stored with the pre-check.
- **FR-11.6** The insurer queue lists claims with filters (tabs, event, asset type, search) and SLA: settlement due from the Policy Record rule applied to `packet_complete_at`, paused while `info_requested`; "Due in 48 h" uses the demo clock.
- **FR-11.7** Review screen per PLAN i04; the decision panel recomputes amounts server side on each change (`preview-amount`), requires a reason when any line differs from the proposal, and shows the Insurer Wallet balance in the approve modal.
- **FR-11.8** `claim.decide` (Tier 3, `underwriter_adjuster` only): approve with final lines and total, or deny with a reason code (peril not covered, notice late, asset not insured, evidence doesn't support loss, other) and a message. The decision is bound to the current packet hash; if the Client changed the packet since the review started, decide is refused with a reload prompt. Writes `claim.approved` or `claim.denied` and emits the event.
- **FR-11.9** Request info (`claim.request_info`, Tier 3) with a message the agent may draft (`claim.draft_info_request`); state `info_requested`; settlement timer paused; the Client sees the request on the claim and in the relevant asset page (c04 banner for tags).
- **FR-11.10** On `payout.executed` the Claim becomes `paid` and the Client is notified.
- **FR-11.11** Appeals (D-18): on denial the agent drafts an appeal from the packet and the decision (Tier 1); the Client edits and confirms through the same Tier 2 gate; the appeal packet goes to the insurer as a new review. After approval the Client can request an appeal draft from c12 within the appeal window. Separately, the Client can open a dispute from c12 (`dispute.open`), which the Superadmin monitors (feature 14); a dispute never changes a decision by itself.
- **FR-11.12** Client claim status (c12): hero with status and amount (count-up only when just paid), timeline from Audit Log events with packet hashes and the adjuster's quotes, amount table per asset with change reasons and the loss-category rule with its clause, appeal card, link to the adjuster's view in demo mode.
- **FR-11.13** Insurer stats view for feature 07: median days from complete packet to decision and claims paid on AiGRI per insurer (aggregates only).
- **FR-11.14** Never auto-deny: no code path sets `denied` except `claim.decide` by a person; a test asserts every transition into `denied` has a person actor.

## Screens

c11 (`system-preview/client/11-claim.html`), c12 (`12-claim-status.html`), i03 (`insurer/03-claims-queue.html`), i04 (`insurer/04-claim-review.html`), client claims list `/client/claims`, appeal draft (no prototype, D-14: compose from c11's consent card and a textarea).

## Audit entries

`claim.packet_drafted`, `claim.confirmed`, `claim.prechecked`, `claim.review_started`, `claim.info_requested`, `claim.approved`, `claim.denied`, `claim.appeal_drafted`.

## Bench cases contributed

Claim scenarios (covered loss, late notice, excluded peril, low-confidence flood, conflicting photo, livestock tag mismatch) with gold coverage, deadline, category and Proposed Amount; counterfactual variants with one fact changed; user effort (alert to confirmed claim ≤ 5 min and ≤ 10 taps); red team: submit with a stale hash, edit after approval, a Finance user approving.
