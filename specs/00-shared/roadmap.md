# Roadmap: features, order and parallel work

AiGRI v2 is built as 18 features. Each has a folder `specs/NN-name/` with `spec.md` (what and why, user stories, requirements, acceptance), `plan.md` (how: modules, tables, endpoints, screens, risks) and `tasks.md` (ordered, testable tasks). The two small features, 17 and 18, keep their tasks inside `spec.md`. Shared contracts live here in `specs/00-shared/`.

## Features

| # | Feature | Delivers | Main screens (prototype file) | Depends on |
| --- | --- | --- | --- | --- |
| 01 | Foundation | Repo, Docker Compose, config, Postgres + PostGIS, migrations, auth (OTP), roles, tenants + RLS, demo clock, country packs, money and format libs, Audit Log, outbox, file storage, mock SMS and email | — | — |
| 02 | Gateway and agent runtime | Tool registry, tiers, capability tags, consent-hash gate, LLM provider adapter (Ollama), quarantined reader, planner, agent call logging | — | 01 |
| 03 | UI shell and design system | Next.js PWA, tokens and `system.css` port, React components, three portal shells, sign-in, kitchen sink, web push registration, typed API client | c01 sign-in; `_kitchen-sink.html` | 01 (auth API contract only) |
| 04 | Policy Compiler and Policy Q&A | PDF upload, quarantined compile, clause spans, self-check, injected-instruction scan, review and publish, versions, Issuance Limits, clause-cited Q&A | i02 publish policy; c07 clause sheet and Q&A | 01, 02, 03, 05 |
| 05 | Rules engine | Pure deterministic library: coverage, deadlines, loss category, Proposed Amount, expected payout, premium | — | none (pure library) |
| 06 | Client onboarding and assets | Sign-up flow, Client profile, Parcels (map drawing), livestock groups, Ear Tags, Capture Page, photo store with hashes | c02 onboarding, c03 parcels, c04 herd | 01, 02, 03 |
| 07 | Risk Model and Curation | Forecast and history ingest for risk, Risk Model outputs, Curation ranking with reasons, compare, ineligible products, replayable runs | c05 risk, c06 policies, c07 policy detail | 04, 05, 06 |
| 08 | Purchase and underwriting | Quote, purchase draft, consent, Tier 2 confirm, premium payment, Issuance Limits, underwriting queue, refund on decline, policy lifecycle | c08 buy; underwriting queue (no prototype) | 04, 07, 12 |
| 09 | Hazards, Loss Events and alerts | GDACS, BMKG, Open-Meteo ingest; Loss Events; alert rules; push, SMS, email; before-photo requests; Client Home | c09 home, c10 alert | 06, 07 |
| 10 | Damage Assessment | Sentinel-1 flood mask and duration, Sentinel-2 NDVI drop, GFM cross-check, confidence, assessed loss %, photo checks, Ear Tag checks, fixture mode | parts of c11, i04 | 06, 09 |
| 11 | Claims | Claim draft and packet, Tier 2 confirm, pre-check, insurer queue, review and decision, info request loop, deny, appeal, deadlines and SLA timers, Client status | c11 claim, c12 claim status, i03 queue, i04 review | 05, 08, 10, 12 |
| 12 | Wallet and payouts | Mock wallet service, double-entry ledger, premium and escrow, payout on approval event, idempotency, refunds, withdraw, funding, reconciliation, payout accounts | c13 wallet, i06 payouts | 01, 02 |
| 13 | Insurer dashboard and portfolio | Adjuster morning view, KPIs, charts, hazard watch, exposure map, concentration note | i01 dashboard, i05 portfolio | 09, 11, 12 |
| 14 | Superadmin and Nudges | Platform overview, system health, insurer onboarding and verification, policy quality and ranking audit, disputes and SLAs, Nudge rules and drafts, country packs screen, Audit Log viewer and chain verify | a01–a06 | 04, 07, 11, 12 |
| 15 | Seed and demo | Synthetic demo data (single source of truth), loader, demo clock scripts, demo accounts, hero story replay, reset | all screens' data | 01 (fixtures can be written from day 1) |
| 16 | AiGRI-Bench | Nine suites, gold answers, red team, one command, results with logs and Audit Log export | — | grows with every feature |
| 17 | Landing page | Port `landing-preview/` to the PWA root route with the Indonesia follow-ups | landing | 03 |
| 18 | Submission deliverables | Technical documentation, security self-assessment, deployment README, execution evidence bundle | — | 16 and all others |

## Waves

Start a wave when the features it depends on have merged their "contract" tasks (the first phase of each `tasks.md`), not when they are finished.

```
Wave 0   01 Foundation ─────────────┐   05 Rules engine [P]   03 UI shell [P]   15 Seed fixtures (data only) [P]
Wave 1   02 Gateway + agent         │   06 Client assets      12 Wallet [P]
Wave 2   04 Policy Compiler         │   07 Risk + Curation    09 Hazards + alerts   10 Damage Assessment
Wave 3   08 Purchase                │   11 Claims
Wave 4   13 Insurer views   14 Superadmin   17 Landing   16 Bench (finish)   18 Deliverables
```

Parallel-safe pairs share no owned paths: see "Owns" in each plan. Shared files that several features touch (the API router list, the nav config, the migration chain) have one owner each, listed in `specs/00-shared/ownership.md`.

## Hero story, end to end

The acceptance test for the whole system is the hero story from the brief, replayed on the demo data in `specs/15-seed-demo/spec.md`. Each step names the feature that makes it work.

| Step | Story date | What happens | Features |
| --- | --- | --- | --- |
| 1 | 5 Jan 2026 | Ayu Lestari (Jasindo product manager) uploads the Rice Flood & Drought Cover PDF, resolves 2 flagged fields, sets Issuance Limits, publishes | 04 |
| 2 | 8 Jan 2026 | Ibu Sri Wahyuni signs up CV Tani Makmur Demak and maps 6 parcels, 48,0 ha | 06 |
| 3 | 9 Jan 2026 | Risk forecast shows flood 34%; Curation ranks 3 products, AUTP not eligible | 07 |
| 4 | 10 Jan 2026 | She confirms the purchase (payload hash `a91c3f0e…77e3`) and pays Rp13.440.000 from the wallet; the policy issues inside limits | 08, 12 |
| 5 | 4 Feb 2026 | BMKG warning; AiGRI alerts at 06:10 WIB with pre-storm steps; before-photos via the Capture Page | 09, 06 |
| 6 | 16 Feb 2026 | After the flood, Damage Assessment per parcel; the agent drafts the Claim Packet; she confirms (hash `7c41e9…b02d`) | 10, 11 |
| 7 | 16–20 Feb 2026 | Pre-check; adjuster requests a DMK-05 photo; she adds 2 photos and reconfirms (`9e02d7…41aa`) | 11, 06 |
| 8 | 24 Feb 2026 | Dimas Prasetyo changes DMK-05 from 20% to 15% with a reason and approves Rp187.800.000 | 11 |
| 9 | 24 Feb 2026 | The approval event triggers payout PAY-26-00318 from the Jasindo wallet automatically | 12 |
| 10 | 1–3 Mar 2026 | CLM-26-000402 passes Sinar Mas's settlement window; a rule Nudge goes out; Rina Kartika sends an AiGRI-drafted second Nudge | 14 |
| Side | 18 Dec 2025 – 26 Feb 2026 | Pak Slamet's cattle: Ear Tags registered, flood mortality claim, unreadable tag photo retaken, approved Rp20.000.000, automatic payout | 06, 10, 11, 12 |

Hashes shown above are the prototype's display values; real hashes are whatever the canonical payloads produce (decision D-12).

## Milestones

| Milestone | Exit criteria |
| --- | --- |
| M1 Walking skeleton | `make up` starts everything; sign-in with a demo account reaches each portal shell; one gateway-checked API call writes an Audit Log entry; CI green |
| M2 Buy path | Hero steps 1–4 work in the browser on seeded data; rules-engine and curation gold tests pass |
| M3 Claim path | Hero steps 5–9 and the cattle side thread work; wallet integrity suite passes |
| M4 Oversight | Step 10, all Superadmin screens, red-team suite before/after numbers |
| M5 Submission | `make bench` full report, deliverables in `docs/`, demo video recorded from the replay |
