# 08 Purchase and underwriting: spec

## Summary

The Client buys a ranked product in four steps: review the agent's draft, give consent to share specific data with that one insurer, pay, and get the policy. Paying is a Tier 2 action: only the Client can do it, and only for the exact packet whose hash they saw. Inside the insurer's Issuance Limits the policy issues at once; outside them it waits for an Underwriter, whose decline refunds the premium automatically.

## User stories

**US-08.1 Buy (c08).** As Ibu Sri Wahyuni on 10 Jan 2026, I buy Rice Flood & Drought Cover for my 6 parcels and get covered in under a minute.
- Given step 1, I see the summary drafted by AiGRI (pill "Drafted by AiGRI") and can change parcels.
- Given step 2, I see exactly what is shared with Asuransi Jasindo ("your business name and NIB, the 6 parcel boundaries, crops, varieties and planting dates. Nothing else.") and tick consent.
- Given step 3, I choose "AiGRI wallet" (balance Rp25.000.000 → Rp11.560.000 after paying) or "BI-FAST virtual account", see "What you're confirming" with the payload fingerprint, and press "Confirm and pay Rp13.440.000"; a modal asks "Pay Rp13.440.000 from your wallet?".
- Given I confirm, then step 4 says "You're covered", policy POL-JSD-26-004127 active 10 Jan – 30 Apr 2026, issued 10 Jan 2026, 09:41 WIB, "Inside Jasindo's issuance limits, so no underwriting was needed", and a toast confirms.

**US-08.2 Changed packet, new consent.** As the Client, if anything changes after I saw the fingerprint (parcels, period, price), I am asked to confirm again.

**US-08.3 Underwriting (no prototype).** As an Underwriter & Adjuster, I see purchases outside our limits, with the reason they fell outside, and accept or decline with a reason.
- Given a 140 ha purchase with the 100 ha auto-issue limit, then it lands in the queue with "Above auto-issue area (140,0 ha > 100 ha)".
- Given I decline, then the premium returns to the Client's wallet automatically and the Client sees why.

**US-08.4 Policy lifecycle.** As a Client, my policy shows Issued, then Active on its start date, then Expired after its end date, without anyone pressing a button.

## Functional requirements

- **FR-08.1** Quote: from a Curation run entry (or directly from c07), create a quote for named assets, the period rule of the record (purchase date to season end, capped by `max_days`), sum insured and premium from the rules engine, with an expiry of 24 hours.
- **FR-08.2** Draft (`purchase.draft`, Tier 1): the agent assembles the purchase packet (`purchase-packet.schema.json`) including the consent data items, which are derived from the record's documents and the asset types, never from free text.
- **FR-08.3** Freeze and hash the packet when the Client reaches the pay step; return the hash for display.
- **FR-08.4** `purchase.confirm` (Tier 2): Client owner only, matching hash, consent ticked, quote not expired, assets not already insured by another active policy for the same peril set with the same insurer (warning, not block, for different insurers). In one transaction: write `client_consents` (`insurer_share`, payload hash), post the premium Client Wallet → escrow (feature 12, D-16), set `premium_paid`, write `purchase.confirmed`, emit `purchase.premium_paid`.
- **FR-08.5** Issuance check (code, Tier 0): within limits when area or heads ≤ auto-issue maximum, sum insured ≤ maximum, regency exposure after this policy ≤ maximum exposure per regency, region in the list, and today in the sale window. Within → issue; outside → `underwriting` (or refuse and refund if the record says `refuse`), with the failed checks listed.
- **FR-08.6** Issue: create `policies` and `policy_assets`, policy number per D-35, release escrow → Insurer Wallet, write `policy.issued`, emit `policy.issued`, notify the Client.
- **FR-08.7** Underwriting queue for `underwriter_adjuster`: list with client, product, assets, amount, failed checks, age; detail with the same data the insurer may see (consented items only); decide accept or decline with a required reason (`underwriting.decide`, Tier 3). Decline refunds escrow → Client Wallet by code.
- **FR-08.8** Virtual-account payment (sandbox): show a generated VA number; the mock wallet simulates the incoming transfer after a button press in `/dev`; the purchase stays `awaiting_confirmation` with a "Waiting for your transfer" state until funds land, and the hash binding is unchanged.
- **FR-08.9** Policy states move Issued → Active → Expired by a daily job on cover dates (D-25).
- **FR-08.10** After issuance, the insurer can read only the covered assets and consented items (RLS view `insurer_covered_assets` now joins `policy_assets`).
- **FR-08.11** Government schemes: the premium shows the subsidy and the client share; the Client pays only the client share; the subsidy is recorded on the policy (sandbox: no money from government is simulated beyond the record).

## Screens

c08 (`system-preview/client/08-buy.html`), the underwriting queue and detail at `/insurer/underwriting` (no prototype; compose from i03's table and i04's decision panel per D-14), and the Client's policy list on `/client/cover` (owned by 07) showing issued policies.

## Audit entries

`purchase.drafted`, `purchase.confirmed`, `consent.given`, `purchase.sent_to_underwriting`, `purchase.declined`, `policy.issued`, `policy.activated`, `policy.expired`, plus wallet entries from 12.

## Bench cases contributed

Red team ASI02: confirm with no hash, a stale hash, a modified packet; another Client's packet id. Wallet integrity: decline refunds exactly the premium.
