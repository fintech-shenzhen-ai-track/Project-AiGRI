# 16 AiGRI-Bench: spec

## Summary

AiGRI-Bench is our own benchmark and the main evidence for task completion (40%) and, through its red-team suite, for security (30%). One command, `make bench`, runs every suite locally and in CI, in the sandbox, and writes scores next to the operation logs and the exported Audit Log of that run, so every number traces to logged actions. Only measured numbers appear; a suite that did not run shows "not run".

## Suites

| Suite | Cases (target) | Metrics | Pass bar |
| --- | --- | --- | --- |
| Policy Q&A | 30 questions over the 8 demo records, gold clause ids, at least 5 unanswerable | Answer accuracy (graded against gold answer keys); citation precision (cited = gold); correct abstentions | Every answer cites a clause or abstains; zero answers without a citation |
| Curation | 3 demo Client profiles × 4 variants = 12 profiles with gold rankings | Rank agreement (exact order and Kendall tau); fit-filter errors; determinism (re-run identical) | Deterministic; zero products shown that fail fit; exact order on the 3 base profiles |
| Claim scenarios | Covered loss; late notice; excluded peril; low-confidence flood; conflicting photo; livestock tag mismatch (6, each for crop or livestock as fits) | Correct coverage, deadline and loss-category outcome; Proposed Amount equals gold; routed to the Adjuster | Zero auto-denials; low confidence and "not detected" never close a claim |
| Counterfactual variants | Each claim scenario × 4 single-fact changes (planting date, variety, date of loss, assessed %) = 24 | Decision flips exactly when gold says; amount follows | Every flip and non-flip matches gold |
| Damage Assessment accuracy | Demak 8 Feb 2024 and 16–17 Mar 2024 (ID, vs GFM); Inday 10–11 Jul 2026 (PH, vs PhilSA); Nov 2025 PH (vs PhilSA on HDX) | Flooded % agreement per parcel (MAE), mask IoU, confidence calibration | Reported as measured, per source, with the known radar limit |
| Historical backtests | The same events on synthetic farms placed in affected districts | Assets alerted; alert lead time; claims filed before each record's notice deadline | Reported as measured; no claim missed for a deadline the record states |
| User effort | Scripted Playwright walkthroughs at 390 px | Onboarding time and taps (Client with < 10 assets); alert → confirmed claim time and taps | Onboarding ≤ 20 min; claim ≤ 5 min and ≤ 10 taps |
| Wallet integrity | Approval, denial, duplicate and replayed events; missing event; wrong amount; bank change in hold window | Payouts without approval; double payouts; ledger vs Audit Log matches | Zero and zero; all match |
| Red team | One test per risk in the security section and tools-and-tiers (ASI01, ASI02, ASI03, ASI06, ASI07, ASI08, ASI09, ASI10, plus ASI04 dependency integrity and ASI05 code-execution attempt) | Attack success rate with defences off vs on | Reported before and after |

## Functional requirements

- **FR-16.1** `make bench` runs all suites against a fresh sandbox stack seeded from the `covered` checkpoint (suites that need other states restore their own checkpoint), with `BENCH_RUN=1`.
- **FR-16.2** Output folder `bench/results/<run-id>/` (run id = UTC timestamp + git short hash) containing `report.md`, `report.json` (scores, case-level results, versions of rules, formula, risk model, pipeline, models with digests), `ops.log.jsonl` (operation logs), `audit.jsonl` + `chain.txt` (exported Audit Log for the run's time range, verifiable), and per-suite artefacts (for example accuracy maps).
- **FR-16.3** Gold answers live in `bench/suites/<suite>/cases/*.yaml`; each case names who checked it (developer, accounting teammate, PolSci teammate) and when.
- **FR-16.4** Model-dependent suites record model name and digest and run each case once at temperature 0; flaky cases are reported, not retried silently.
- **FR-16.5** The red-team suite runs every case twice: `SECURITY_DEFENCES=off` (sandbox-only path in feature 02) and on; it reports attack success rate for each and lists any case that succeeded with defences on as a blocker.
- **FR-16.6** CI runs the deterministic suites (Curation, Claim scenarios with fixture assessments, Counterfactuals, Wallet integrity, Red team non-model cases) on every push; model and satellite suites run nightly and on demand.
- **FR-16.7** `bench/README.md` explains how a judge reruns one suite and verifies the Audit Log chain of a results folder.
- **FR-16.8** The report never shows an estimate: missing data is "not run" or "not available" with the reason.

## Out of scope

Comparisons with other products; leaderboard submissions.
