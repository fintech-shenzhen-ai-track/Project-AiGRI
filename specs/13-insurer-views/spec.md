# 13 Insurer dashboard and portfolio: spec

## Summary

The adjuster's morning view (i01) and the exposure map (i05): what needs a decision today, how much money is proposed and available, what hazards are still active over insured assets, and where the insurer's exposure is concentrated. Read-only views over data owned by features 04, 09, 10, 11 and 12, always inside the insurer's tenant.

## User stories

**US-13.1 Morning view (i01).** As Dimas Prasetyo on 24 Feb 2026, 08:30 WIB, I see the Nudge about CLM-26-000409 due tomorrow, "41 claims open. AiGRI has pre-checked 14 of them.", KPIs (Open claims 41 · Due in 48 h 3 · Proposed, open Rp1,24 M · Wallet balance with its cover ratio of open proposed amounts; the absolute balance comes from the seeded ledger, see R-001), open claims by status and decisions per day, my next three claims by SLA, hazard watch, and our products.

**US-13.2 Exposure (i05).** As the Adjuster, I see insured rice in Central Java (6.840 ha, Rp41,2 M) against the latest flood extent (2.120 ha, about Rp13,9 M), toggle map layers, read the concentration note "Demak holds 38% of your Central Java rice sum insured", and switch to cattle.

## Functional requirements

- **FR-13.1** Dashboard KPIs: open claims (split by asset type), due in 48 h (feature 11 SLA buckets), sum of open Proposed Amounts (compact money with the full amount in `title`), Insurer Wallet balance and coverage ratio (balance ÷ open proposed, 1 decimal).
- **FR-13.2** Charts: open claims by status (stacked horizontal bar: Submitted, Pre-checked, Under review, Info requested) and decisions per day for the last 7 days (bars), each with "Show as table".
- **FR-13.3** "Next up": top three open claims by settlement due date, linking to review.
- **FR-13.4** Nudges for this insurer (feature 14) appear as a need banner on the dashboard with "Open claim" and "All nudges"; viewing marks them `seen` (`nudge.seen`).
- **FR-13.5** Hazard watch: insured area currently inside the latest flood extent (from Damage Assessment or GFM extent over `policy_assets`) with the change since the event peak, and the current official forecast summary for the insurer's regions.
- **FR-13.6** Products card: the insurer's records by status (Live, Draft, Needs review) linking to feature 04.
- **FR-13.7** Portfolio: stats (insured area, sum insured, area in flood extent now with its sum insured estimate, open claims), map with toggles (insured parcels, flood extent with its date, rain forecast 72 h from the official source, livestock farms), legend, controls, concentration note when one regency holds ≥ 30% of the insurer's sum insured in a province (threshold in config), table by regency with a meter of the share in flood extent, and a cattle panel.
- **FR-13.8** All figures computed within the tenant (RLS); no other insurer's data, not even aggregates.
- **FR-13.9** The concentration note is advisory copy only (info banner), never an action.

## Screens

i01 (`system-preview/insurer/01-dashboard.html`), i05 (`05-portfolio.html`).

## Audit entries

`nudge.seen`.
