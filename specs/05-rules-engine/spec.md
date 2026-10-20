# 05 Rules engine: spec

## Summary

A pure, deterministic Python library that turns a published Policy Record plus facts (assets, dates, Damage Assessments, risk classes) into coverage answers, deadlines, loss categories, sums insured, premiums, expected payouts and the Proposed Amount. No database, no network, no model. Curation (07), purchase (08) and claims (11) all call it, so the amount a Client was promised at ranking time is computed by the same code the Adjuster sees at decision time.

Why it matters: InsClaimBench found that joint decision-and-amount accuracy of LLMs falls to 47,54–73,15% even when single-rule accuracy reaches 95,48% ([arXiv 2610.09671](https://arxiv.org/abs/2610.09671), cited in the brief). Amounts therefore come from code.

## User stories

**US-05.1 Proposed Amount the Adjuster can trust.** As Dimas Prasetyo, I see a per-parcel Proposed Amount with the clause behind each step.
- Given the hero claim (PLAN 2.8), then the proposed lines are DMK-01 Rp76.800.000, DMK-02 Rp50.400.000, DMK-03 Rp31.680.000, DMK-04 Rp21.120.000, DMK-05 Rp10.400.000, total Rp190.400.000, each citing Clauses 6.1, 6.2 and 6.3.
- Given the Adjuster changes DMK-05 to 15%, then that line is Rp7.800.000 and the total Rp187.800.000.

**US-05.2 Deadlines from the record.** As a Client, I see "Report by 21 Feb 2026" because the record says 7 days after the event ends and the flood ended 14 Feb.

**US-05.3 Same answer every time.** As a judge, I re-run any computation on the same inputs and get byte-identical output.

## Functional requirements

- **FR-05.1** `sum_insured(record, asset, as_of)`: per hectare = amount × area (× stage % from `by_stage` at the crop stage on `as_of`, from planting date); per head = min(declared value, cap) × head count; rounded per D-37.
- **FR-05.2** `premium(record, sum_insured, scheme)`: rate × sum insured; with a scheme, split into subsidy and client share using `scheme.subsidy_pct`.
- **FR-05.3** `coverage(record, policy, asset, loss_event)`: returns `covered | not_covered | needs_adjuster` with reasons and clauses. Checks: policy active on the loss date; peril listed; asset on the policy. Peril conditions (minimum inundation days, irrigation failure days) are evaluated when the evidence holds the measure, else `needs_adjuster` with the condition text. Exclusions are listed for the Adjuster, never evaluated from free text. The function never returns a denial; `not_covered` is a pre-check note the Adjuster sees.
- **FR-05.4** `deadlines(record, loss_event, notice_at=None, complete_at=None, decision_at=None)`: resolves every `deadlines[]` entry to a date in the pack time zone, calendar or business days (business = Monday–Friday; public holidays are roadmap), each with its clause and source.
- **FR-05.5** `loss_category(record, assessed_pct)`: first matching category by `min_loss_pct` (inclusive) and `max_loss_pct` (exclusive).
- **FR-05.6** `proposed_amount(record, policy, lines)`: for each line (asset, sum insured, assessed %): apply loss category (`full_sum_insured`, `assessed_pct_of_sum_insured`, `nothing`), then the deductible (`franchise` or `deductible`, `per_asset` or `per_policy`, D-07); return line amounts, total, and the clause trail per line. Livestock: matched heads × per-head sum insured, with unmatched tags at zero and listed.
- **FR-05.7** `expected_payout(record, assets, risk_outputs)`: Σ over assets and covered perils and classes of p(class) × payout(damage fraction × 100 as assessed %), using FR-05.6 per asset; perils not covered contribute zero. Returns money in the record currency.
- **FR-05.8** `fit(record, risk_outputs)`: covered expected loss ÷ total expected loss across perils, as a 4-place decimal string.
- **FR-05.9** Every function is pure, typed (`mypy --strict`), uses `Decimal` with an explicit context, and returns frozen dataclasses that serialise to canonical JSON.
- **FR-05.10** The library carries a version string; every caller records it with its output.

## Non-functional

- 100% branch coverage on `rules/`.
- Property tests: monotonicity (a higher assessed % never pays less under the same record), franchise boundary exactness, sum of lines equals total.

## Out of scope

Parametric triggers (roadmap), public holidays, currency conversion (display only, in 03).
