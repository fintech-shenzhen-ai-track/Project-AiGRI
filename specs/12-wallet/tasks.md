# 12 Wallet and payouts: tasks

Depends on 01 and 02 only for the core; consumers attach when 08 and 11 emit their events (use fake events in tests until then).

## Phase A: contracts

- [x] **T-12.01** Migration `0012` with ledger constraints and the payout trigger check. FR-12.2, FR-12.4.
- [ ] **T-12.02** `PartnerWalletAdapter` protocol and the mock wallet service API. FR-12.1.
- [ ] **T-12.03** Endpoints and models with stubs; OpenAPI regenerated. Wallet creation interface used by 06's onboarding.

## Phase B: ledger and movements

- [ ] **T-12.04** Ledger posting with invariants and per-wallet locking. Test first: random concurrent transfers keep every wallet's sum and balance_after consistent.
- [ ] **T-12.05** Premium, escrow release and refund movements plus consumers. FR-12.3.
- [ ] **T-12.06** Payout consumer with idempotency and approval-trigger verification; pending-funds path. FR-12.4, FR-12.5. Test first: replayed event, missing event, wrong amount, wrong claim.
- [ ] **T-12.07** [P] Payout account change with OTP and 24 h hold. FR-12.6.
- [ ] **T-12.08** [P] Withdrawals, top-ups, insurer funding, alert level. FR-12.7, FR-12.8.
- [ ] **T-12.09** [P] Reconciliation queries and integrity checks. FR-12.9, FR-12.10.

## Phase C: UI

- [ ] **T-12.10** c13 Client wallet with payout-arrived banner, count-up, tabs, accounts, withdraw sheet. US-12.1, US-12.2.
- [ ] **T-12.11** i06 Insurer wallet and payouts. US-12.3.

## Phase D: bench

- [ ] **T-12.12** Wallet integrity suite and wallet red-team cases. US-12.4.
