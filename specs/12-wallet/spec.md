# 12 Wallet and payouts: spec

## Summary

Every Client and Insurer has a Wallet; the platform has an escrow wallet. Money moves only when a person acts or when code reacts to a person's recorded action, never on an agent call. An Adjuster's approval event pays the Client automatically from the pre-funded Insurer Wallet, exactly once. Every movement is a double-entry ledger pair and a hash-chained Audit Log entry. For the hackathon the wallet is a sandbox mock with the API a licensed partner adapter would expose; no real money moves.

## User stories

**US-12.1 Payout arrived (c13).** As Ibu Sri Wahyuni on 24 Feb 2026, 14:32 WIB, I see "Payout arrived: Rp187.800.000" with the sun-rise mark, my balance counting up from Rp11.560.000 to Rp199.360.000, and the ledger with the payout, the premium and my top-up.

**US-12.2 Withdraw.** As the Client, I withdraw Rp150.000.000 to BCA ••••4821 via BI-FAST with the fee shown (Rp2.500) and "Usually within a minute".

**US-12.3 Insurer wallet (i06).** As Wulan Sari (Finance, Jasindo) on 26 Feb 2026, I see the wallet balance (computed from the ledger, R-001), live integrity checks, payouts with the approval that triggered each one, money in, and I can add funds.

**US-12.4 Exactly once.** As a judge, I replay an approval event, call the wallet with no event, and change bank details mid-payout, and nothing is paid twice, nothing is paid without approval, and the change is held.

## Functional requirements

- **FR-12.1** Wallet service interface (partner-shaped): create wallet, top up, transfer (from, to, amount, currency, idempotency key, trigger), refund, balance, statement. The sandbox implementation is `mock_services/wallet/` (its own small service and database schema); the backend talks to it only through `wallet/adapter.py`.
- **FR-12.2** Ledger: every movement is one `wallet_txns` row and two or more `ledger_entries` that sum to zero, each with the balance after; append-only; balances never go negative except the platform's external-funding source account in the sandbox.
- **FR-12.3** Premium: on `purchase.confirmed` code posts Client Wallet → escrow (`wallet.post_premium`); on `policy.issued` escrow → Insurer Wallet (`wallet.release_escrow`); on `purchase.declined` escrow → Client Wallet (`wallet.post_refund`). D-16.
- **FR-12.4** Payout: the consumer of `claim.approved` posts Insurer Wallet → Client Wallet (or the linked bank via the rail, sandboxed) with idempotency key `payout:<claim_id>` and `trigger_event_seq` = the approval's Audit Log seq. The ledger rejects a payout with no approval seq, with an approval for another claim, or with an amount different from the decision's final amount.
- **FR-12.5** Insufficient Insurer balance: the payout waits in `pending_funds`, the Insurer's Finance users and the Superadmin are notified, and it posts automatically when funds arrive; the claim shows "Approved, waiting for the insurer's wallet" (never "denied").
- **FR-12.6** Payout account change (D-19): Tier 3, owner only, OTP required; for 24 hours after a change, payouts land in the AiGRI Wallet balance instead of the bank and are flagged for Finance.
- **FR-12.7** Withdrawals (Client only, D-26): amount ≤ available balance, to a verified payout account, fee from the pack rail table (BI-FAST fee shown), sandbox settlement immediate; `wallet.withdrawal`.
- **FR-12.8** Insurer funding (Finance only): sandbox top-up from the verified funding account; low-balance alert threshold per Insurer Wallet; `wallet.funded`.
- **FR-12.9** Reconciliation for Finance (i06): premiums in, payouts out, refunds and running balance per product; each ledger line links to its policy or claim; tenant isolation applies.
- **FR-12.10** Integrity checks (live on i06 and in the bench): payouts without an approval event = 0; double payouts = 0; ledger vs Audit Log mismatches = 0; payout-account changes in the 24 h before a payout = 0. Computed by SQL over the ledger and Audit Log, run nightly and on demand.
- **FR-12.11** Currency: every movement settles in the policy currency; any display conversion is labelled "approx." (feature 03).
- **FR-12.12** Every wallet screen shows the "Sandbox" pill next to money movements; the Client wallet header shows the country indicator on mobile ("Indonesia · IDR").

## Screens

c13 (`system-preview/client/13-wallet.html`), i06 (`system-preview/insurer/06-payouts.html`); wallet cards on c09 and i01 read from here.

## Audit entries

`wallet.created`, `wallet.top_up`, `wallet.premium_posted`, `wallet.escrow_released`, `wallet.refund_posted`, `payout.executed`, `wallet.withdrawal`, `wallet.funded`, `payout_account.changed`.

## Bench cases contributed

Wallet integrity suite (approval, denial, duplicate and replayed events, missing event, wrong amount, bank change in the hold window); red team ASI02/ASI08 wallet rows from the brief.
