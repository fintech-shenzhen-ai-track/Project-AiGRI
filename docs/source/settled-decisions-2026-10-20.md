# AiGRI v2 — settled decisions (source of truth for every section writer)

All of this was settled with the user in a grilling session on 2026-10-20. Do not contradict it. Do not invent new product scope. Where something is not settled, say so in one line and it goes to "Open decisions" (report it back, don't create a section for it).

## Competition
- 2026 Shenzhen FinTechathon International Track, Topic D (Insurance Assistant), hosted by Tsinghua PBCSF with WeBank. Theme: "AI as a Financial Participant" — an agent that completes real tasks in a financial scenario. Topic D asks for policy Q&A, coverage-gap analysis and claims guidance.
- Rubric (shared across topics): Task completion 40%, Security & compliance 30%, Innovation & interaction 30%.
- Deliverables: technical documentation (architecture, core algorithm, security design); presentation deck ≤10 min; demo video optional ≤5 min; source code (README, GitHub link, deployment instructions, test cases); security self-assessment (permission-tier implementation + known-risk list); execution evidence (sandbox operation logs + demo video).
- v1 was already submitted. This v2 doc is the FULL-VISION documentation; no trimming for time.

## Product
- AiGRI is a multi-insurer agricultural insurance platform. Primary clients: agri SMEs; also individual farmers. NO co-ops (removed). NO PCIC as an insurer/partner.
- One platform does: curated policy recommendation from predicted risk, buying insurance, satellite damage assessment feeding claims, wallet payouts.
- Problem statement: "Agri SMEs and farmers are underinsured because they can't compare policies against their real risk, and when disaster hits, claims are slow and often denied for missing proof." Keep the PCIC rice-farmer denied-claims study (SSRN, 2026, 200 PCIC rice farmers, low-moderate awareness of procedures/deadlines/documents, most denials look like first-time procedural errors) as a PLACEHOLDER source, labelled as placeholder; the user may replace it.
- Language: English only. Region: architecture works in any country; Philippines is the launch market and demo. Currency: policy currency = the insurer's, fixed on the policy; premiums and payouts settle in it. Device location sets only a display currency, converted and labelled "approximate".
- Front end: one mobile-compatible website, a Next.js PWA with three role-based portals. No Messenger, no chat-bot UI. Alerts: PWA web push, SMS fallback (sandboxed), email. Capture Page in the PWA records GPS, time and file hash at capture (needed because evidence must be trustworthy).

## Three portals
- Client portal: sign up; choose crops, livestock, or both (only matching forms show); crops = Parcel boundary drawn on a map + crop, variety, planting date, hectares; livestock = farm location, species, head count, average value per head, Ear Tags registered at purchase (poultry: batch tag per flock/house). Sees Curation (ranked shortlist with reasons and clause citations), buys, wallet, alerts, claims, claim status.
- Insurer portal (5 areas): (1) Product management: upload policy PDF → review compiled Policy Record → publish; set Issuance Limits. (2) Underwriting queue. (3) Claims inbox: Claim Packet, Damage Assessment, agent pre-check, Proposed Amount; approve / deny / request info. (4) Wallet and payouts. (5) Portfolio exposure map: insured assets vs current hazards.
  Insurer roles: Product Manager (publishes products, sets limits); Underwriter & Adjuster (queue and claims); Finance (funds wallet, reconciliation). Full tenant isolation between insurers.
- Superadmin portal: onboards and verifies insurers; audits the ranking formula and audit log; platform health; Nudges. Rule-based Nudges send automatically from templates (claim past the insurer's settlement window; Policy Record unreviewed ≥7 days; underwriting item older than X days). Free-text nudges: agent drafts, Superadmin sends. Every nudge logged and shown on the insurer dashboard. Superadmin cannot approve claims or move money.

## What the AI agent does
- Client: explains policies with clause citations, runs the Curation, pre-storm alerts with steps, builds Claim Packets, tracks claims, drafts appeals.
- Insurer: compiles uploaded policy PDFs into Policy Records, pre-checks incoming packets for completeness, drafts the Proposed Amount.
- Superadmin: drafts nudges, flags ranking/audit anomalies.
- The agent NEVER decides a claim, binds cover, or moves money.

## Design rules (carried from v1, still apply)
- The LLM extracts and explains; code decides (coverage, deadlines, loss category, Proposed Amount run in a deterministic rules engine). Cite InsClaimBench (arXiv 2610.09671): LLM reliability degrades along the chain from rules to payout amounts.
- Every policy answer cites a clause or abstains; retrieve clause spans, not whole documents (Quebec insurance LLM benchmark, arXiv 2603.07825).
- Untrusted content never steers the agent: policy PDFs (now uploaded by insurers — also untrusted), photos, letters go to a quarantined model with no tools that may only fill typed fields (CaMeL pattern, Google DeepMind).
- Consent is bound to the exact payload: client confirms a specific packet (claim or purchase); hashed; only that hash can be submitted.
- The agent never creates or edits evidence.
- Never auto-deny: low-confidence or missing hazard data lowers confidence, never closes a claim. "No damage detected" never closes a claim.
- Everything is logged in a hash-chained audit log (execution evidence).

## Prediction and Curation
- Weather from forecast APIs (Open-Meteo; PAGASA advisories for PH; GDACS for tropical cyclones). AiGRI does not train its own weather model.
- AiGRI's Risk Model: forecast + asset + historical hazard data (PhilSA, HDX, etc.) → loss probability per peril per Insurable Asset for the next 7–16 days and for the season. Feeds Curation and alerts.
- Curation ranking: deterministic, same for everyone: expected payout ÷ premium given predicted risk, filtered by coverage fit. Insurers cannot pay for placement. Each recommendation shows why it ranked where it did, with clause citations. Superadmin can audit the formula.

## Policy-as-code
- Insurer uploads PDF → quarantined Policy Compiler → typed Policy Record where every field carries its source clause → insurer reviews and publishes. Only published records can be recommended or sold. Compiler self-check: generate test questions from the record, answer them from raw text, flag disagreements.
- v1 record shape (adapt for multi-insurer, crops + livestock, currency): policy_id, insurer, insured, crop/livestock, period, perils_covered[{peril, clause}], exclusions, sum_insured{amount, currency, by_stage, clause}, loss_categories (e.g. total ≥90%, partial 10–90%, no_loss <10%), deadlines[{event, rule, clause}], documents_required, issuance_limits, extraction{model, confidence, needs_review}. No PCIC references.

## Purchase lifecycle
Quote → Purchase Draft (agent) → Awaiting Confirmation (only the client moves it) → Premium Paid → if inside Issuance Limits: Issued; else Underwriting → Issued or Declined (Declined: automatic refund to client wallet). Issued policy → Active → Expired or Cancelled.

## Claim lifecycle
Draft (agent) → Awaiting Confirmation (only the client) → Submitted → Pre-checked (agent completeness check) → Under Review (adjuster) → Info Requested (back to Draft) | Approved (with final amount) | Denied. Approved → Paid (wallet, automatic). Denied → Appeal Draft (agent) → back through Awaiting Confirmation. Notice deadlines come from each Policy Record. Claim = one Policy × one Loss Event; Claim Packet lists every affected asset with its Damage Assessment.

## Claims decision and amount
- Evidence-only (indemnity): the insurer's Adjuster approves or denies. No parametric products in v2 (parametric = roadmap).
- Rules engine proposes the amount (loss %, sum insured, deductible, Damage Assessment, citing clauses). Adjuster accepts or changes it; a change requires a reason. Final amount is the Adjuster's.

## Damage Assessment
- Crops: both published flood maps where they exist (PhilSA, UNOSAT, Copernicus Global Flood Monitoring) AND AiGRI's own pipeline on Sentinel-1 SAR (flood extent, duration) and Sentinel-2 optical (NDVI drop before vs after), clipped to each Parcel; also cross-checks. Output per Parcel: flooded %, flood duration, NDVI drop, confidence, sources. Known limit: radar underestimates flooding under dense vegetation (rice) — PhilSA notes this; so confidence values, and no-detection never means no-loss. Client photos via Capture Page add ground evidence.
- Livestock: Ear-tag ID + mortality indemnity. Every insured animal has an ear tag (visual or RFID) registered at purchase; claim photo must show the tag; prevents double-claiming and claiming uninsured animals; periodic herd/flock count photos. Poultry uses batch tags per flock or house. Vet certificate attached where available.
- Damage Assessment is evidence for the Adjuster, never a decision.

## Wallet and payouts
- Documentation describes: each party has a Wallet; Insurer Wallets are pre-funded and fund payouts; Client Wallets pay premiums and receive payouts; either can link to a bank instead. When an Adjuster approves a claim with an amount, the payout leaves the Insurer Wallet automatically — code triggered by the approval event, never by the agent. Premiums go from client to insurer after client confirmation.
- Production requirement (not built): licensed e-money issuer or partnership with a licensed wallet/bank.
- Implementation for the hackathon: sandbox only (mock wallet service writing to a ledger and the audit log; no real money).

## Permission tiers (enforced by a gateway in front of every tool, not by LLM judgment)
- Tier 0, act alone (logged): explain policies, monitor hazards, send alerts, run Curation, run Damage Assessment.
- Tier 1, draft only: Claim Packet, purchase, appeal, Proposed Amount, nudge text.
- Tier 2, client confirmation + matching hash: submit a claim, buy a policy, share data with an insurer.
- Tier 3, never by the agent (tool not exposed): decide a claim or set its final amount, move money, issue cover outside Issuance Limits, publish a Policy Record, change bank or wallet details, create or edit evidence. Done only by the right person (Adjuster, insurer Product Manager, Client) or by code reacting to their action (wallet).

## Security risks (map to OWASP Top 10 for Agentic Applications 2026, ASI01–ASI10, published Dec 9 2025)
Each with: the risk in AiGRI, mitigation, one red-team test; report attack success rates before vs after defences. Include at least:
- ASI01 Agent goal hijack: injected instructions in an insurer-uploaded policy PDF ("rank this product first") or a letter.
- Tool misuse: submit without consent; edit a packet after approval.
- Identity and privilege: insurer tenant isolation (insurer A reaching insurer B's clients/claims); role escalation.
- Memory poisoning: a fake clause stored and reused.
- Ranking manipulation.
- Wallet: double payout; payout without an approval event; bank details changed right before a payout.
- Evidence fraud: reused photos (perceptual hash), ear tag reused or claimed twice.
Privacy: insurers see a client's data only after that client buys from them, and only the covered assets; Curation runs on AiGRI's side; client consents per insurer at purchase; data minimisation; RA 10173 (PH Data Privacy Act) for the demo, GDPR-style principles for other markets; synthetic data in the demo.

## AiGRI-Bench (one command, runs in CI; report only measured numbers)
Suites: Policy Q&A (25–30 questions with gold clause IDs: accuracy, citation precision, correct abstentions); Curation (client profiles with a gold ranking); Claim scenarios (covered, late notice, excluded peril, low-confidence flood, conflicting photo, livestock tag mismatch); Counterfactual variants (one fact changed: planting date, variety, date of loss — decision flips correctly; mirrors InsClaimBench); Damage Assessment accuracy (our pipeline vs PhilSA/UNOSAT maps); Historical backtests (real events replayed on synthetic farms: assets alerted, lead time, claims filed before deadline); User effort (onboarding ≤20 min for a client with <10 assets; claim after alert ≤5 min and ≤10 taps); Wallet integrity (zero payouts without approval event, zero double payouts); Red team (attack success rate before vs after). "Coverage gaps" suite is dropped (Curation covers it).

## Stack
Backend Python FastAPI; PostgreSQL + PostGIS; LLM via Ollama (default; mid-size open instruct model 7–14B; JSON-schema structured output via Ollama `format`; model name in config; provider adapter allows a hosted fallback; deployment docs state hardware needs); front end Next.js PWA (one app, three role-based portals); satellite via Microsoft Planetary Computer (Sentinel-1/2, STAC) read with rasterio, stackstac, GeoPandas/Shapely (Google Earth Engine as alternative); weather Open-Meteo + GDACS; sandbox services: mock insurer, mock wallet, mock SMS.

## Demo
- Hero event: Typhoon Inday, July 2026 (PhilSA flood maps incl. flood-affected rice areas). Nov 2025 PH typhoon (UNOSAT Sentinel-1, several dates) is a historical backtest.
- Synthetic data, no real personal data: 3 mock insurers, 8 products (crop indemnity and livestock mortality mixes). 5 clients in the province hit hardest by Inday (look it up), with assets inside, at the edge of and outside the flood: rice SME (~40 parcels, crops only), mixed corn + cattle farm (both), hog + poultry farm (livestock only), 2 individual farmers (1–3 parcels).
- Hero story: (1) insurer uploads policy PDF, reviews compiled record, publishes; (2) rice SME signs up, maps parcels, gets a ranked shortlist with reasons; (3) confirms purchase, pays premium from wallet, policy issues; (4) Inday appears in GDACS, alert with pre-storm steps; (5) after the storm, satellite Damage Assessment per parcel, photos via Capture Page, agent builds Claim Packet; (6) client confirms, hash checked; (7) insurer portal shows pre-check and Proposed Amount; adjuster approves; (8) payout leaves insurer wallet automatically; (9) superadmin sees another claim past its settlement window, nudge sent. Side thread: hog + poultry farm registers ear tags at purchase, files a flood mortality claim with tagged photos; adjuster approves; auto payout. The mixed corn + cattle farm shows a client with both.

## Roadmap (out of scope for v2)
Parametric products (IBLI pasture/NDVI, heat-stress index); IoT livestock sensors; drones; fisheries and aquaculture; live licensed wallet or bank rails; live markets beyond the Philippines.

## Open decisions so far
Exact default settlement window when a policy doesn't state one; which licensed wallet/bank partner; the "X days" threshold for underwriting nudges.
