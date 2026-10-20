# 08 Purchase and underwriting: tasks

Depends on 04, 05, 07 (quotes from runs), 12 (wallet code tools).

## Phase A: contracts

- [ ] **T-08.01** Migration `0008` (`quotes`, `purchases`, `policies`, `policy_assets`) with RLS; finish the `insurer_covered_assets` view. FR-08.10.
- [ ] **T-08.02** Endpoints and models with stubs; OpenAPI regenerated.

## Phase B: backend

- [ ] **T-08.03** Quotes from rules engine. FR-08.1.
- [ ] **T-08.04** Packet builder, freeze and hash. FR-08.2, FR-08.3. Test first: changing any asset, the period or the premium changes the hash.
- [ ] **T-08.05** Confirm through the gateway Tier 2 gate, consent record, premium to escrow, events. FR-08.4. Test first for every refusal path.
- [ ] **T-08.06** Issuance limits check with the regency exposure counter, issue, escrow release. FR-08.5, FR-08.6.
- [ ] **T-08.07** Underwriting queue and decision with automatic refund on decline. FR-08.7.
- [ ] **T-08.08** [P] Virtual-account sandbox path. FR-08.8.
- [ ] **T-08.09** [P] Lifecycle job. FR-08.9.
- [ ] **T-08.10** [P] Scheme subsidy split on the policy. FR-08.11.

## Phase C: UI

- [ ] **T-08.11** c08 buy flow. US-08.1, US-08.2. Done when: matches `system-preview/client/08-buy.html` at 1280 and 390 and the e2e test buys the hero policy from seeded data.
- [ ] **T-08.12** Underwriting queue and detail (D-14). US-08.3.

## Phase D: bench

- [ ] **T-08.13** Red-team ASI02 purchase cases; wallet integrity decline case; a user-effort script for the buy flow.
