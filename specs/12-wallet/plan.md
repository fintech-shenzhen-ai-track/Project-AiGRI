# 12 Wallet and payouts: plan

## Owns

`backend/aigri/wallet/`, `mock_services/wallet/`, routers `client_wallet.py`, `insurer_wallet.py`, migration `0012_*` (`wallets`, `payout_accounts`, `wallet_txns`, `ledger_entries` in the AiGRI database; the mock service keeps its own mirror to emulate a partner), `portals/app/client/wallet/`, `portals/app/insurer/wallet/`.

## Design

```
wallet/
  adapter.py       PartnerWalletAdapter protocol; SandboxAdapter calls mock_services/wallet
  ledger.py        post(txn) → entries; invariants; balance_after; SELECT ... FOR UPDATE per wallet
  movements.py     post_premium, release_escrow, post_refund, post_payout, withdraw, fund, top_up
  consumers.py     purchase.confirmed / policy.issued / purchase.declined / claim.approved
  accounts.py      payout account changes with OTP and hold window
  integrity.py     the four checks as SQL
  tools.py
mock_services/wallet/
  app.py           create, top_up, transfer(idempotency_key), refund, balance, statement, simulate_va_payment
```

Ledger uniqueness: `wallet_txns.idempotency_key` unique; `kind = 'payout'` requires `trigger_event_seq` (CHECK) and a trigger function verifies that seq's action is `claim.approved` for the same claim and amount. Defence in depth with the gateway's FR-02.5.

## Endpoints

| Method | Path | Tool |
| --- | --- | --- |
| GET | `/api/v1/client/wallet` | read (balance, season summary, accounts) |
| GET | `/api/v1/client/wallet/transactions?filter=all\|in\|out` | read |
| POST | `/api/v1/client/wallet/top-up` | `wallet.top_up` (sandbox) |
| POST | `/api/v1/client/wallet/withdrawals` | `wallet.withdraw` |
| POST | `/api/v1/client/wallet/payout-accounts` | `payout_account.change` (OTP) |
| GET | `/api/v1/client/wallet/statement.csv` | read |
| GET | `/api/v1/insurer/wallet` | read (balance, integrity, stats) |
| GET | `/api/v1/insurer/wallet/payouts` | read |
| GET | `/api/v1/insurer/wallet/money-in` | read |
| POST | `/api/v1/insurer/wallet/funding` | `wallet.fund` |
| PUT | `/api/v1/insurer/wallet/alert-level` | `wallet.fund` (Finance only; same role and tier) |
| GET | `/api/v1/insurer/wallet/reconciliation?product=` | read |

## UI notes

- c13: payout-arrived ok banner with the sun-rise mark (only when a payout arrived since the last visit); `wallet-hero` green card with count-up from the previous balance; "This season" `.kv`; activity tabs All / Money in / Money out with `.txn` rows; payout accounts card with the note "Changing payout details needs a code sent to your phone. AiGRI's assistant can't change them."; withdraw sheet with the one yellow in the sheet.
- i06: green wallet hero (no count-up for insurers), integrity check-list, three stats, payouts table with trigger column linking to the claim, money-in card, add-funds sheet.
