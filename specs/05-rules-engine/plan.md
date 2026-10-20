# 05 Rules engine: plan

## Owns

`backend/aigri/rules/` only. No migrations, no routes.

## Layout

```
rules/
  __init__.py      VERSION = "rules-1.0.0"; public functions
  model.py         Frozen dataclasses: PolicyRecordView (parsed from the schema), AssetFacts, LossEventFacts,
                   AssessmentFacts, Line, ProposedAmount, CoverageResult, DeadlineSet, RiskClass
  money.py         uses core.money (Decimal, rounding D-37); no float anywhere
  sum_insured.py
  premium.py
  coverage.py
  deadlines.py
  categories.py
  amount.py        proposed_amount, payout_for_pct
  expected.py      expected_payout, fit
  trail.py         clause trail builder
tests/rules/
  test_gold_hero_claim.py
  test_gold_curation.py
  test_gold_schemes.py
  test_properties.py
```

`rules` imports nothing from the database or the agent. It takes a validated Policy Record body (dict matching the schema) and converts it into `PolicyRecordView`.

## Gold tables (test first)

All figures from `system-preview/PLAN.md` section 2. IDR, whole rupiah.

Hero claim CLM-26-000418, record PR-JSD-RFD-2026 (Rp8.000.000/ha; franchise 10% per parcel; total ≥90% pays 100%; partial 10–90% pays assessed %):

| Parcel | ha | Sum insured | Assessed % | Category | Proposed |
| --- | --- | --- | --- | --- | --- |
| DMK-01 | 9,6 | 76.800.000 | 92 | total | 76.800.000 |
| DMK-02 | 8,4 | 67.200.000 | 75 | partial | 50.400.000 |
| DMK-03 | 7,2 | 57.600.000 | 55 | partial | 31.680.000 |
| DMK-04 | 8,8 | 70.400.000 | 30 | partial | 21.120.000 |
| DMK-05 | 6,5 | 52.000.000 | 20 | partial | 10.400.000 |
| Total | 40,5 | 324.000.000 | | | 190.400.000 |

With DMK-05 at 15%: 7.800.000; total 187.800.000.

Boundary cases on the same record: 9% → 0 (franchise); 10% → 10% of sum insured; 89% → 89%; 90% → 100%.

Curation (CV Tani Makmur Demak, 48,0 ha):

| Record | Sum insured | Premium | Expected payout (from seeded risk) | Score (2 dp) |
| --- | --- | --- | --- | --- |
| PR-JSD-RFD-2026 | 384.000.000 | 13.440.000 (3,5%) | 19.622.400 | 1,46 |
| PR-ASK-RYP-2026 | 360.000.000 | 11.520.000 (3,2%) | 15.091.200 | 1,31 |
| PR-SMI-PFC-2026 | 288.000.000 | 6.912.000 (2,4%) | 8.156.160 | 1,18 |

The expected payouts depend on the seeded risk outputs; feature 15 calibrates the seed so these come out exactly (task T-15.07). Until then the curation gold test checks sum insured, premium and the score formula with injected expected payouts.

Schemes (Pak Slamet):

| Record | Basis | Sum insured | Premium | Subsidy | Client share |
| --- | --- | --- | --- | --- | --- |
| PR-JSD-AUTP-2026 | 1,2 ha × 6.000.000 | 7.200.000 | 216.000 (3%) | 172.800 (80%) | 43.200 |
| PR-JSD-AUTSK-2026 | 12 head × min(18.500.000, cap 10.000.000) | 120.000.000 | 2.400.000 (2%) | 1.920.000 | 480.000 |

AUTP payout: damage ≥75% pays the full sum insured (CLM-26-000436: 1,2 ha → 7.200.000). AUTS/K payout: CLM-26-000431, 2 matched head → 20.000.000.

Deadlines (PR-JSD-RFD-2026): flood ended 14 Feb 2026 → notice due 21 Feb 2026 (Clause 8.1, 7 calendar days after the event ends); complete packet 20 Feb 2026 → decision due 6 Mar 2026 (Clause 9.1, 14 calendar days). Sinar Mas CLM-26-000402: complete 14 Feb → due 28 Feb 2026.

## Notes

- Percent inputs are integers or decimal strings; convert with `Decimal(str)`; never from float.
- `by_stage` uses `until_days_after_planting` boundaries; the demo records have no stages, so add synthetic-record tests for stages.
