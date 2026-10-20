# Developer A handoff: Platform, trust and money

You own the parts of AiGRI that must be correct for the security score (30%) and for every money and coverage number: the foundation, the gateway and agent runtime, the rules engine, the wallet, purchase, the Policy Compiler, Damage Assessment, the demo seed and the benchmark. Developer B owns the user journeys and portals and builds on your contracts. You build some screens too (i02, c08, c13, i06, underwriting), using B's components.

## 1. Your features

Work top to bottom. "Contract" is the first merge B is waiting for; ship it before the rest of the feature.

| Order | Feature | Wave | Tasks | Your screens | Contract B waits for | You wait for (from B) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 01 Foundation | 0 | 20 | `/dev` inbox and clock APIs | C01, C02, C03 | none |
| 2 | 05 Rules engine | 0 | 12 | none | C06, then C16 | none |
| 3 | 02 Gateway and agent | 1 | 15 | none | C07, C11, C12 | none |
| 4 | 12 Wallet | 1 | 12 | c13, i06 | C08 | C05 components; C22 for real payouts (build against fakes first) |
| 5 | 04 Policy Compiler and Q&A | 2 | 18 | i02, `/insurer/products`, clause sheet, `PolicyQA` | C13, C14, C15 | C05 |
| 6 | 10 Damage Assessment | 2 | 15 | none (B shows the records) | C19 first | C09, C10, C18 |
| 7 | 08 Purchase and underwriting | 3 | 13 | c08, underwriting queue | C21 | C20, C05 |
| 8 | 15 Seed and demo | 0 → 4 | 12 | `/dev` account switcher | C25 (with teammates) | every service, as it lands |
| 9 | 16 Bench | 0 → 4 | 11 | none | C24 | B's gold cases |

Total: 128 tasks. Contract C26 (gateway registry export for the security self-assessment) is due in wave 4 for B's feature 18.

## 2. Day one

1. Unzip the repo, create the GitHub repository, push `main`, protect it (pull requests and green CI required).
2. Read, in order: `AGENTS.md`, `.specify/memory/constitution.md`, `specs/00-shared/` (all files), then `specs/01-foundation/`.
3. Agree three things with B in a first 30-minute call:
   - The lanes in `specs/00-shared/ownership.md`.
   - The daily sync time.
   - The rule that contracts are merged and ticked in `handoff/contracts-board.md`.
4. Hand `handoff/TEAMMATES.md` to the accounting and PolSci teammates so feature 15's fixtures start today.
5. Start two coding agents: one on 01, one on 05. Section 3 has the prompts.

Hardware: the full stack runs `qwen3:14b` (about 12 GB VRAM) and `qwen3-vl:8b`. If your machine is smaller, set `LLM_MODEL=qwen3:8b` in `.env` (D-10).

## 3. Run sheet per feature

Every kickoff prompt starts with the same base. Paste the base, then the feature lines.

**Base prompt:**

> You are implementing feature `{NN-name}` of AiGRI, in Developer A's lane (Platform, trust and money). Read, in order: `AGENTS.md`, `.specify/memory/constitution.md`, `specs/00-shared/roadmap.md`, `specs/00-shared/decisions.md`, `specs/00-shared/ownership.md`, `handoff/contracts-board.md`, then `specs/{NN-name}/spec.md`, `plan.md` and `tasks.md`, and every `specs/00-shared/` file the plan links to. Work through `tasks.md` in order; merge Phase A (the contract) first and tick its row on the contract board in the same pull request. Write only inside the paths your feature owns. Test first where the task says so. Tick each task in the commit that completes it. If something is unclear, check `decisions.md`; if it has no answer, add a row under "Raised by agents" and continue with tasks that don't depend on it. Do not invent scope, insurer names, regulations or numbers.

### 01 Foundation

Add to the base:
> Pay special attention to: the API database role must not own tables or bypass RLS; `datetime.now()` is banned outside `core/clock.py`; the formatter cases file is shared with the frontend, so its outputs must match DESIGN.md section 11 exactly (U+2212 minus, no space after "Rp"); the RLS test discovers tables from the catalog so new tables are covered automatically; verify the ID pack region codes against BPS (T-01.09).

Done means: `make up` brings every service to healthy; a demo account signs in; one gated call writes a verifiable Audit Log entry; CI is green.

### 05 Rules engine

Add:
> This is a pure library: no database, network or model. Write every gold table in `plan.md` as failing tests before any code. Use `Decimal` only. Jasindo's Clause 6.2 is a per-parcel franchise (D-07). Round once per asset line (D-37). Expected payouts for Curation are calibrated later by feature 15, so test the formula with injected values until then.

Done means: the hero claim gives Rp190.400.000 proposed and Rp187.800.000 after the DMK-05 change; 100% branch coverage.

### 02 Gateway and agent runtime

Add:
> The registry must match `specs/00-shared/tools-and-tiers.md` exactly; write the parity test first. Tier 3 tools are never registered for the agent. The planner never receives raw untrusted text. `SECURITY_DEFENCES=off` must be impossible outside a sandbox bench run. A hosted model fallback is allowed only if the provider enforces JSON schemas (D-10).

Done means: the router-graph test fails on an ungated route; the injected-instruction fixture yields only schema fields; `qwen3:8b` fills a schema in an integration test.

### 12 Wallet and payouts

Add:
> The ledger is the source of truth for every balance (decision R-001). Premiums go through escrow (D-16). A payout requires the Audit Log seq of a `claim.approved` event for the same claim and amount, enforced in both the gateway and a database trigger. Build the payout consumer against fake `claim.approved` events; Developer B's claims feature emits the real ones later (contract C22).

Done means: the wallet integrity checks report zero payouts without approval and zero double payouts under replayed and missing events; c13 and i06 match the prototype.

### 04 Policy Compiler and Policy Q&A

Add:
> Use a permissively licensed PDF library, not an AGPL one. Excluded spans (hidden text, instructions to AI) never reach extraction or Q&A retrieval. `extraction.confidence` is a coverage measure, not a model probability; label it so. A record cannot publish without a settlement window (D-17). Ship the clause sheet and `PolicyQA` component early (contract C15); B's c06 and c07 use them.

Done means: the seeded Jasindo PDF compiles with exactly two flags (the drought condition and the deductible scope); ACA's PDF shows the page-23 finding; the Q&A gold set abstains correctly on unanswerable questions.

### 10 Damage Assessment

Add:
> Do task T-10.02 (fixture mode) first; Developer B's claims feature needs fixture records (contract C19). Real-imagery validation uses the real Demak floods of 8 Feb 2024 and 16–17 Mar 2024 against Copernicus GFM (D-05, D-36); choose scene dates from STAC search results, never from memory. "Not detected" never closes a claim. Each confidence reason lowers confidence one step.

Done means: fixture records for the hero claim and the cattle claim exist; the accuracy harness reports measured agreement with GFM on both 2024 events.

### 08 Purchase and underwriting

Add:
> Payment is Tier 2: the Client confirms the exact frozen packet and its hash. Lock the insurer–regency exposure counter to avoid races. A decline refunds from escrow by code. The underwriting queue has no prototype; build it only from DESIGN.md components (D-14).

Done means: the e2e test buys the hero policy from seeded data; every refusal path in the red-team purchase cases returns the right error and Audit Log entry.

### 15 Seed and demo

Add:
> The teammates transcribe fixtures (T-15.01–T-15.05); you review them and own the story script. Build the demo through service calls, never raw SQL, so hashes and the Audit Log are real. Make every hero photo pair distinct by perceptual hash. The risk calibration must hit PLAN 2.6 to the rupiah. Wallet balances come from the ledger (R-001).

Done means: `make seed` ends with every gold assertion passing; all 11 checkpoints restore.

### 16 Bench

Add:
> Report only measured numbers; a suite that did not run says "not run". Every red-team case runs with defences off and on. Export the Audit Log for each run with a chain file a judge can verify.

Done means: one `make bench` run produces a complete results folder, committed as the sample for the submission.

## 4. What you owe B, in priority order

C01 → C03 → C02 → C06 → C07 → C08 → C11 → C12 → C16 → C13 → C14 → C15 → C19 → C21 → C24 → C26. Full list in `handoff/contracts-board.md`.

## 5. Shared things you are the single owner of

- **Migration chain.** Features number their revision files; you resolve `alembic merge heads` when two land together.
- **CI workflows.**
- **Router registration file.** On conflicts, keep every line.
- **`decisions.md`.** Settle "Raised by agents" rows with B at the daily sync; you write the final entry.

## 6. Reviewing B's pull requests

Check every B pull request against this list before approving:

- [ ] Every new route uses `gate("<tool>")` with a tool from `tools-and-tiers.md`; read routes use `client.read`, `insurer.read` or `admin.read`.
- [ ] No coverage, deadline, amount or ranking computed outside `rules/` or `curation/`; UI never computes money.
- [ ] Tier 2 actions send only `{id, hash}`, never a packet body.
- [ ] No code path moves a claim to `denied` except `claim.decide` by a person.
- [ ] New tables have RLS (the catalog test passes) and insurer reads of client assets go through `insurer_covered_assets`.
- [ ] Untrusted text (advisories, letters, photos) goes only through the quarantined reader.
- [ ] Audit Log entries listed in the spec are written and asserted in tests.
- [ ] Time comes from `core.clock`; formatting comes from the pack.

## 7. Milestones for your lane

| Milestone | Your exit criteria |
| --- | --- |
| M1 Walking skeleton | C01–C03, C07 merged; gated call logs to a verifiable chain |
| M2 Buy path | 04, 05, 08, 12 done; hero steps 1 and 4 work |
| M3 Claim path | 10 fixture and pipeline done; real payouts from B's approvals; wallet integrity suite green |
| M4 Oversight | Red-team suite before/after numbers; C26 delivered |
| M5 Submission | Full `make bench` sample committed; all checkpoints restore |
