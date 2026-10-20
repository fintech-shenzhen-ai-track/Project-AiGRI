# 11 Claims: tasks

Depends on 05, 06, 08 (policies), 09 (Loss Events, affected answers), 10 (assessment records; fixture mode is enough to start), 12 (payout consumer).

## Phase A: contracts

- [ ] **T-11.01** Migration `0011` (`claims`, `claim_packets`, `prechecks`, `claim_decisions`, `info_requests`, `appeals`) with RLS.
- [ ] **T-11.02** Endpoints and models with stubs; Pydantic model for `claim-packet.schema.json`; OpenAPI regenerated.
- [ ] **T-11.03** State machine module with the transition table from `events.md` and the never-auto-deny test. FR-11.14. Test first.

## Phase B: backend

- [ ] **T-11.04** Drafting from policy, loss event, assessments and photos; versions. FR-11.1, FR-11.2.
- [ ] **T-11.05** Timers: notice due, settlement due, pause/resume, SLA buckets. FR-11.3, FR-11.6. Test first with the PLAN dates.
- [ ] **T-11.06** Freeze and Tier 2 submit. FR-11.4.
- [ ] **T-11.07** Pre-check list and Proposed Amount. FR-11.5. Done when: the hero claim pre-check produces the 8 lines in PLAN i04 item 2 and Rp190.400.000.
- [ ] **T-11.08** Review: start, preview amount, decide (bound to packet hash), request info with agent draft. FR-11.7–FR-11.9.
- [ ] **T-11.09** [P] Consumers: paid on payout, appeal draft on denial, draft refresh on new assessment. FR-11.10, FR-11.11.
- [ ] **T-11.10** [P] Insurer stats aggregates. FR-11.13.

## Phase C: UI

- [ ] **T-11.11** c11 check and confirm. US-11.1. Done when: matches `system-preview/client/11-claim.html` at 1280 and 390 and the e2e submits the hero packet.
- [ ] **T-11.12** c12 status and the client claims list. US-11.5.
- [ ] **T-11.13** i03 queue. US-11.2.
- [ ] **T-11.14** i04 review and decision with sheets and modals. US-11.3, US-11.4. Done when: the e2e changes DMK-05 to 15%, approves, and sees the payout card.
- [ ] **T-11.15** Appeal draft screen (D-14). US-11.6.
- [ ] **T-11.16** Livestock claim path end to end with the retake loop. US-11.7.

## Phase D: bench

- [ ] **T-11.17** Claim scenario suite (6 scenarios) and counterfactual variants with gold answers (accounting teammate checks amounts; PolSci teammate checks clause readings and deadlines).
- [ ] **T-11.18** User-effort script: alert → confirmed claim, count taps and time at 390 px.
- [ ] **T-11.19** Red-team claim cases (stale hash, edit after approval, Finance approving, cross-tenant claim id).
