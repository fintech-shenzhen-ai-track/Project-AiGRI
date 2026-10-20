# 05 Rules engine: tasks

No dependencies beyond `core.money` and `core.hashing` (feature 01, Phase B). If those are not merged yet, start with local copies of their interfaces and switch imports later.

## Phase A: contracts

- [x] **T-05.01** `rules/model.py` dataclasses and `PolicyRecordView.from_body(dict)` with schema validation. FR-05.9.
- [x] **T-05.02** Write all gold tests from the plan (failing). Test first.

## Phase B: functions

- [x] **T-05.03** [P] `sum_insured` with stages and per-head caps. FR-05.1.
- [x] **T-05.04** [P] `premium` with scheme subsidy split. FR-05.2.
- [x] **T-05.05** [P] `loss_category`. FR-05.5.
- [ ] **T-05.06** [P] `deadlines` (calendar and business days, pack time zone). FR-05.4.
- [ ] **T-05.07** `proposed_amount` with franchise/deductible × per asset/per policy and livestock heads. FR-05.6. Done when: hero gold table passes.
- [ ] **T-05.08** `coverage` returning covered / not_covered / needs_adjuster with trails. FR-05.3.
- [ ] **T-05.09** `expected_payout` and `fit`. FR-05.7, FR-05.8.
- [ ] **T-05.10** Clause trail builder and canonical serialisation; `VERSION`. FR-05.9, FR-05.10.

## Phase C: assurance

- [ ] **T-05.11** Property tests (monotonicity, boundaries, line sums) and 100% branch coverage gate. Non-functional.
- [ ] **T-05.12** Counterfactual cases for the bench (feature 16): each claim scenario with one fact changed (planting date, variety, date of loss, assessed %) and the gold flip or non-flip, reviewed by the accounting teammate.
