# 07 Risk Model and Curation: spec

## Summary

AiGRI predicts, per Insurable Asset and per peril, the chance and size of a loss for the next 7–16 days and for the season, from bought-in forecasts and historical hazard data (it trains no weather model). Curation then ranks published products for the Client with one auditable formula: expected payout ÷ premium under that predicted risk, after dropping products that cover too little of the predicted loss. Each ranked product shows why, with clause citations, including what it does not cover. This is Topic D's "coverage-gap analysis".

## User stories

**US-07.1 See my risk (c05).** As Ibu Sri Wahyuni on 9 Jan 2026, I see that flood is my biggest risk this season (34%, High), drought 6% (Low), pest and disease 11% (Moderate), the flood chance per parcel, the 16-day rain outlook, why, and the sources.
- Given the seeded risk, then the bars show DMK-01 31%, DMK-02 28%, DMK-03 24%, DMK-04 19%, DMK-05 14%, DMK-06 6%, with the top three in the risk colour, and "Show as table" reveals the same numbers.
- Given the "Next 16 days" segment, then the rain chart shows the 16 values with the 50 mm/day heavy-rain line and the caption about the highest day.

**US-07.2 Ranked cover (c06).** As the Client, I see 3 policies that fit my rice parcels, ranked, each with premium, sum insured, expected payout and the ratio "expected payout per Rp1 of premium", reasons with clause chips, and the AUTP scheme shown as not eligible with its rule.
- Given the seed, then the order is Jasindo 1,46, Askrindo 1,31, Sinar Mas 1,18, and AUTP shows "Not eligible. For farmer-group members farming up to 2 ha. Your business farms 48,0 ha."

**US-07.3 Understand one policy (c07).** As the Client, I see what it costs for my parcels, what is and is not covered, how much it pays with a worked example, the deadlines, common questions answered with clauses (feature 04), the insurer's track record on AiGRI, and what the insurer will see if I buy.

**US-07.4 Fair and replayable.** As Rina Kartika (Superadmin), I can replay any Curation run and get the identical ranking, and I can see that no input can buy placement.

## Functional requirements

Risk Model:

- **FR-07.1** Run per Insurable Asset (each Parcel; each livestock group), per peril, at two horizons (`d1-16`, `season`), producing `risk-output.schema.json` records. Rerun when a forecast snapshot updates, when an asset changes, and daily.
- **FR-07.2** Flood, short horizon: P(class k) = P(rain over the trigger amount, share of ensemble members) × P(this asset floods into class k given trigger rain, from past mapped events at the asset). Flood, season: historical flood frequency per class over the coverage window, smoothed for assets with few observed events. Typhoon wind: share of ensemble members whose gusts at the asset fall in class k; a GDACS cyclone event raises the refresh rate. (Brief, "Layer 2".)
- **FR-07.3** Drought and pest and disease are modelled from versioned base-rate tables per region, crop and season (configuration with a source note per row) until dedicated models exist; their confidence is capped at `medium` with the reason "base rate".
- **FR-07.4** Expected loss and loss probability per the brief formula; confidence band p10–p90 from running each ensemble member through the same steps; confidence label lowered by wide spread, few past events or a missing layer. Missing data widens the band and never sets risk to zero.
- **FR-07.5** Farm-level peril probability ("chance of a damaging flood on at least one parcel") is computed from the joint scenario set (ensemble members or historical events evaluated across all assets together), not by multiplying independent parcel probabilities, because parcels flood together.
- **FR-07.6** Vulnerability tables `V(peril, class, stage or species)` and class edges are versioned config files in `risk/config/` with a source note per row; their versions are stored in every output.
- **FR-07.7** Forecast inputs: Open-Meteo Forecast and Ensemble APIs (daily precipitation sum, gusts, max temperature; hourly soil moisture), history from Open-Meteo Historical Weather (ERA5) and mapped flood events (GFM archive and national records in the ID pack; PhilSA/HDX in the PH pack). Calls are cached in `forecast_snapshots`; the free-tier limit is respected (D-27).

Curation:

- **FR-07.8** Candidates: published Policy Records only, sold in the Client's regency (Issuance Limits regions), matching the Client's crops or species, with a coverage period overlapping the season and a sale window that includes today; ineligible products (eligibility rules such as AUTP's 2 ha limit) are listed as not eligible with the rule and clause.
- **FR-07.9** Coverage-fit filter: drop a product when fit < θ (D-23); show dropped products with a one-line reason.
- **FR-07.10** Score = expected payout ÷ premium (rules engine FR-05.7) in the policy currency; for schemes, use the premium the Client pays (client share). Sort by score descending; ties at 2 decimals break by higher fit, then lower premium, then record id ascending.
- **FR-07.11** Reasons: up to three per product from templates (`covers`, `not_covered`, `pays_from`, `decision_window`, `lowest_premium`, `subsidy`), each with clause ids from the record. Wording follows PLAN c06 exactly for the demo products.
- **FR-07.12** Every run writes `curation_runs` with formula version, risk model version, input snapshot (record versions, risk output ids and hashes, asset snapshot) and its hash, and the output; `curation.ran` in the Audit Log.
- **FR-07.13** Replay: `curation.replay(run_id)` recomputes from the stored snapshot and must produce byte-identical canonical output; used by feature 14's ranking audit.
- **FR-07.14** No input to the formula comes from an insurer except typed published record fields and the quote; there is no sponsorship, boost or order field anywhere in the schema or code (a test greps the curation module and schema).
- **FR-07.15** Curation never shares which Client saw which product with any insurer.

Policy detail (c07):

- **FR-07.16** Show cost for the Client's assets, covered perils, exclusions, payout table with a worked example for the Client's largest parcel at 50% loss, deadlines with "AiGRI tracks these for you and warns you 2 days before", common questions (04), the insurer's median decision time and claims paid on AiGRI (from 11), "What <insurer> will see" (the purchase consent data items), and the buy card with "Get covered" (one yellow).

## Screens

c05 (`system-preview/client/05-risk.html`), c06 (`06-policies.html`), c07 (`07-policy-detail.html`), including the compare sheet and clause sheets.

## Audit entries

`risk.computed`, `curation.ran`.

## Bench cases contributed

Curation suite: one profile per demo Client plus variants (more parcels, a new crop, a product removed, a premium change), each with a gold ranking; determinism (re-run identical); zero products shown that fail fit.
