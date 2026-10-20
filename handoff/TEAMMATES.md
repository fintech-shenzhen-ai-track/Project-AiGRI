# Accounting and PolSci teammates: what to do now

The two developers and their coding agents build AiGRI from specs. Before they can test anything, they need the demo data written into files, and the correct answers ("gold answers") that tests compare against. That is careful reading and arithmetic, not coding, and it can start today. Developer A reviews what you write.

All the source data is in `system-preview/PLAN.md`, section 2 ("Shared demo data"). Copy figures exactly; never round or recompute them. If PLAN doesn't give a value you need, write `synthetic: true` next to it and a one-line note saying why you chose it.

## Accounting teammate

| Task | What to produce | Where |
| --- | --- | --- |
| T-15.01 (part) | Transcribe the money tables: policies (2.7), the hero claim per parcel (2.8), other claims (2.9), wallets (2.3 ledger, 2.10) | `seed/fixtures/claims.yaml`, `wallets.yaml` |
| T-05.12 | For each of 6 claim scenarios, write 4 variants with one fact changed (planting date, variety, date of loss, assessed %) and the expected outcome and amount | `bench/suites/counterfactual/cases/` |
| T-07.16 | Check the expected-payout and ratio arithmetic for the Curation gold rankings | `bench/suites/curation/cases/` |
| T-11.17 (part) | Expected Proposed Amount for each claim scenario | `bench/suites/claim_scenarios/cases/` |
| Review | Check decision R-001 in `specs/00-shared/decisions.md` (insurer wallet balances that don't reconcile) and tell the team which option you support | — |

Rules for the money: rupiah have no decimals; a partial loss pays assessed % × sum insured; a loss under 10% pays nothing on the Jasindo product; 90% or more pays the full sum insured.

## PolSci teammate

| Task | What to produce | Where |
| --- | --- | --- |
| T-15.02 (part) | Write the clause texts for the 8 synthetic policies, matching the clause numbers and wording in PLAN screens c06, c07, i02 and a03 | `seed/policies/*.md` |
| T-04.17 | 30 policy questions with the correct clause number for each, including at least 5 the policy doesn't answer (the correct answer is "Not stated in this policy") | `bench/suites/policy_qa/cases/` |
| T-11.17 (part) | For each claim scenario: is it covered, which deadline applies, and the clause | `bench/suites/claim_scenarios/cases/` |
| T-09.03 support | Help confirm how BMKG publishes heavy-rain warnings and whether reuse is allowed | note in `specs/00-shared/decisions.md`, D-27 |
| Review | Check that consent text and privacy copy match UU PDP (Law 27/2022) for the Indonesia demo | comment on the c02 and c08 pull requests |

## Format example

```yaml
# bench/suites/policy_qa/cases/q07.yaml
id: q07
record: PR-JSD-RFD-2026
question: "Am I covered if a levee breaks?"
gold: {answer_key: covered_with_condition, condition: "water covers the crop for 3 days or more", clauses: ["4.1"]}
checked_by: [polsci]
checked_on: 2026-10-21
```

Ask Developer A to set up the folders and a short screen-share on how to commit files if you haven't used Git before.
