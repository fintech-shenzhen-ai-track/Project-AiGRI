# 08 Purchase and underwriting: plan

## Owns

`backend/aigri/purchase/`, routers `client_purchase.py`, `insurer_underwriting.py`, migration `0008_*`, `portals/app/client/cover/buy/`, `portals/app/insurer/underwriting/`.

## Endpoints

| Method | Path | Tool | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/client/quotes` | `client.read` (computes, stores nothing binding) | `{record_key, asset_ids?}` → quote |
| POST | `/api/v1/client/purchases` | `purchase.draft` | `{quote_id}` → purchase in `draft` |
| PATCH | `/api/v1/client/purchases/{id}` | `purchase.draft` | change assets or payment method; returns to `draft` |
| POST | `/api/v1/client/purchases/{id}/freeze` | `purchase.draft` | → `awaiting_confirmation` with `{packet, packet_hash}` |
| POST | `/api/v1/client/purchases/{id}/confirm` | `purchase.confirm` (Tier 2) | `{packet_hash, consent: true}`, `Idempotency-Key` |
| GET | `/api/v1/client/purchases/{id}` | read | state, step timestamps, policy when issued |
| GET | `/api/v1/client/policies` | read | the Client's policies |
| GET | `/api/v1/insurer/underwriting` | read | queue |
| GET | `/api/v1/insurer/underwriting/{purchase_id}` | read | detail |
| POST | `/api/v1/insurer/underwriting/{purchase_id}/decision` | `underwriting.decide` | `{decision, reason}` |

## Services

```
purchase/
  quotes.py       uses rules.sum_insured, rules.premium
  packets.py      build_packet(), freeze() (JCS + sha256 via core.hashing)
  confirm.py      gateway.confirm_tier2 → wallet.post_premium (code tool, trigger seq) → state
  issuance.py     check_limits() → issue() | route_to_underwriting()
  underwriting.py decide()
  lifecycle.py    daily job: activate, expire
  consumers.py    outbox: purchase.premium_paid → issuance
  tools.py
```

Exposure per regency is the sum of active and issued policies' sum insured for that insurer in that regency, read in the same transaction with `SELECT ... FOR UPDATE` on an insurer-regency counter row to avoid races between two purchases.

## UI notes

- c08 uses `<Flow>` with 4 steps; the pay step `.split` (pay card left, "Steps done" card right); the modal confirm button is `.btn-ink` "Pay now" (the yellow belongs to the page's "Confirm and pay" button); loading dots for 0,9 s minimum so the state change is perceivable; step 4 tick pop and toast.
- Underwriting queue: `.table` with columns Purchase · Client · Product · Assets · Premium · Failed check · Age · chevron; detail page: left the purchase packet and consented data, right a decision card (Accept with `.btn-y`, Decline with `.btn-danger`, reason textarea required).
