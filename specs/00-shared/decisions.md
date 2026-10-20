# Decisions

This file settles conflicts between the source documents and gives a default for every open question, so the build never waits. Each entry has an ID that specs and commits cite. A default can be changed later by editing its entry; code reads most of them from configuration, not constants.

Precedence when sources disagree: this file, then the feature specs, then `docs/source/technical-brief-v2.md` (Indonesia sections over the older Philippine sections, as the brief itself says), then `system-preview/PLAN.md` for screen content and demo data, then `DESIGN.md` for look.

## Settled conflicts

| ID | Topic | Decision | Why |
| --- | --- | --- | --- |
| D-01 | Launch market | Indonesia is the live country pack. Every Philippine example in the brief (PHP, PhilSA, PAGASA, Cotabato, Typhoon Inday) belongs to the planned PH pack. | The brief's own precedence note; DESIGN.md, PLAN.md and all prototype screens use Indonesia. |
| D-02 | Demo data | The demo data is `system-preview/PLAN.md` section 2, transcribed into `specs/15-seed-demo/`. It replaces the brief's "Demo data" bullet list (Cotabato, 3 mock insurers, 5 clients). Insurers: Asuransi Jasindo, Askrindo, Asuransi Sinar Mas (live), Asuransi Central Asia (in verification). 8 Policy Records. Clients: CV Tani Makmur Demak, Pak Slamet Santoso, CV Agro Lestari Tuban, plus queue-only farmers. | The screens were built on it and every figure there is cross-consistent. |
| D-03 | Repo layout | Backend modules from the brief live under `backend/aigri/<module>/` as one Python package. Module names are unchanged. | One importable package, one `pyproject.toml`. |
| D-04 | Data protection law | The demo follows Indonesia's UU PDP (Law 27/2022), from the ID pack. RA 10173 applies to the PH pack. The consent principles (specific, informed, per insurer, minimal data) are the same in code. | D-01. |
| D-05 | Hero event and satellite evidence | The hero event "Central Java floods, Feb 2026" is synthetic, so real satellite imagery cannot show it. Its Damage Assessments are fixture records (`source: fixture`) with the PLAN values. The real pipeline is built and validated on real events: Demak, 8 Feb 2024 (Wulan river dam collapse, about 1.400 ha of rice submerged) and 16–17 Mar 2024 (Wulan embankment breach) against Copernicus GFM; Typhoon Inday (July 2026) against PhilSA for the PH pack. | Honest data: synthetic outputs are labelled; accuracy numbers come from real events. Sources: [Tempo, 9 Feb 2024](https://en.tempo.co/amp/1831634/floods-in-demak-submerge-1400-ha-of-rice-crops-8000-displaced), [Tempo, 18 Mar 2024](https://en.tempo.co/amp/1846418/floods-submerge-11-districts-in-demak-as-6-dams-burst). |
| D-06 | Clause numbers | Demo Policy Records use the clause numbers in PLAN section 2.5 and screens c06, c07, i02 (for example Clause 4.1 flood, 6.2 under-10% rule, 8.1 notice, 9.1 decision window). The brief's `S3.1(a)`-style ids are only an example shape. | Screens and record must agree. |
| D-07 | "Deductible" meaning | The rules engine supports two kinds: `franchise` (losses below the threshold pay nothing; losses at or above pay in full) and `deductible` (the threshold is subtracted). Each applies `per_asset` or `per_policy`. Jasindo's Clause 6.2 is a per-parcel franchise at 10%, which is what makes PLAN section 2.8 add up. The compiler flags ambiguous wording and the Product Manager chooses (screen i02). | PLAN 2.8 pays DMK-04 30% × Rp70.400.000 = Rp21.120.000, with no deduction. |
| D-08 | Assessed loss % | The rules engine takes an assessed loss % per asset as input. `damage/` proposes it from a versioned vulnerability table (flood duration class × crop stage → damage fraction) times flooded share, with the NDVI drop as a floor when no flood is detected, rounded to whole percent. The Adjuster can change it with a reason. Demo fixtures store the PLAN values (92, 75, 55, 30, 20) directly. | Keeps the Proposed Amount deterministic and traceable; the table is configuration. |
| D-09 | Demo clock | `core.clock` has two modes: `real` (UTC now) and `demo` (a stored "story now" that scripts move forward). All deadlines, SLAs, Nudges and alerts read `clock.now()`. The UI shows the story date in the topbar in demo mode. | Every screen has a story date (PLAN 1). |
| D-10 | Models | Text and schema filling: `qwen3:14b` (fallback `qwen3:8b`), `think: false` for schema calls. Images (Ear Tag numbers, photo descriptions, scanned vet certificates): `qwen3-vl:8b` (6,1 GB), which needs Ollama 0.12.7 or later ([Ollama](https://registry.ollama.ai/library/qwen3-vl)). Model names live in config (`LLM_MODEL`, `LLM_VISION_MODEL`). A hosted fallback must enforce JSON schemas itself, because Ollama's cloud does not support structured outputs (brief, Ollama notes). | `qwen3` is text-only; the brief requires reading tag numbers from photos. |
| D-11 | "Mock insurer" | Insurers are real tenants inside AiGRI, so there is no separate insurer system. `mock_services/adjuster_bot/` is a scripted actor that signs in as an Adjuster and calls the public API (through the gateway) for bench runs and the demo replay. | The brief's mock insurer exists for sandboxed end-to-end runs. |
| D-12 | Hashes in the prototype | Hash strings in PLAN and the prototype (`a91c3f0e…77e3`, `7c41e9…b02d`, audit hashes) are display placeholders. Real values come from the canonical payloads. Tests assert the algorithm, not those strings. | They cannot be reproduced from text. |
| D-13 | Maps | Two renderers behind one `Map` component: `maplibre` (MapLibre GL JS with a configurable vector style URL, used for drawing parcels and real geography) and `schematic` (the prototype's SVG look, drawn from the same parcel geometries, used by default for demo recordings and as the offline fallback). `MAP_RENDERER` in config. Drawing uses Terra Draw on MapLibre. | Parcels must be drawn on a real map; the prototype look must stay available. |
| D-14 | Screens with no prototype | Underwriting queue (insurer), appeal draft (client), register an animal (client), notification and profile settings, insurer staff management (admin). Compose them only from DESIGN.md components and the closest prototype layout (named in each spec). | No new visual language. |
| D-15 | Livestock in the demo | Code and schemas support cattle, buffalo, goats, swine and poultry (batch tags per flock or house). The demo has cattle only (Pak Slamet). The brief's hog and poultry farm is not in the Indonesia demo. | D-02; the PLAN notes hogs are a small market in Indonesia. |
| D-16 | Premium escrow | A paid premium moves Client Wallet → platform escrow wallet. On Issued, code moves it escrow → Insurer Wallet. On Declined, code refunds escrow → Client Wallet. A refund therefore never depends on the Insurer's balance. | Resolves the brief's open "refund source" question without new risk. |
| D-17 | Missing settlement window | A Policy Record cannot be published without a settlement window. If the PDF states none, the field is `needs_review` and the Product Manager must enter one; it is recorded as "set by insurer, not in the document". There is no platform default. | No invented regulation; the brief says deadlines are never platform constants. |
| D-18 | Appeals | When a Claim is Denied, the agent drafts an appeal automatically (Tier 1; nothing is sent). After Approved or Paid, the Client can ask for one ("Draft an appeal", c12). Appeal window: the Policy Record's value if stated, else 30 days from the decision, shown with its source. | Brief default plus prototype c12. |
| D-19 | Payout account changes | Changing a payout account is Tier 3, done only by the account owner with an OTP. For 24 hours after a change, a Payout lands in the AiGRI Wallet balance instead of the bank, and the change is flagged for Finance. | i06 integrity check "no payout-account changes in the 24 h before a payout". |
| D-20 | Insurer staff roles | The Superadmin creates the insurer tenant and assigns the first roles at onboarding (a02). Later changes are made by the Superadmin on the insurer's written request. Every change writes the Audit Log. Insurer self-service role management is roadmap. | a02 shows roles assigned by the platform. |
| D-21 | Underwriting-age Nudge | The rule exists but is disabled until a threshold is set; a04 shows "Not set yet · Open decision". | Matches the prototype; avoids inventing a number. |
| D-22 | Alert threshold | Alert a Client when, for any covered or registered asset, the 7–16 day loss probability is at least `ALERT_LOSS_PROB` (default 0,30) or an official heavy-rain or flood warning (BMKG in the ID pack) covers the asset's regency. Configurable per pack. | Brief leaves it unset; this default is labelled as such in config. |
| D-23 | Coverage-fit θ | 0,50, in config `CURATION_THETA`. | Brief worked example. |
| D-24 | Herd count photos | Every 30 days per livestock group, plus on request by an Adjuster. | Prototype c04 "Take this month's count". |
| D-25 | Policy lifecycle | Issued → Active on the cover start date and Active → Expired after the end date, by a scheduled job. Cancelled exists as a state but no v2 screen or rule creates it. | Brief default; cancellation terms unset. |
| D-26 | Withdrawals | Clients can withdraw to their verified payout account (c13). Insurers fund but do not withdraw in v2. | Prototype scope. |
| D-27 | Data source access | Open-Meteo free tier for the hackathon (non-commercial, under 10.000 calls a day); paid plan for production. Sentinel-1 RTC (needs a Planetary Computer account), with GRD as a fallback path. Copernicus GFM needs registration and a bearer token. BMKG warnings: use BMKG's public open-data feeds if available, else parse the public warning pages through the quarantined reader (confirm the access method in task T-09.03). | Brief data-source table; BMKG access not yet verified. |
| D-28 | Curation formula changes | The formula lives in code with a version string. A change needs a pull request approved by two maintainers and bumps the version. The Superadmin audits and replays but cannot edit. | Brief open decision. |
| D-29 | Nudge timing | Rule Nudges run daily at 09:00 in the pack's time zone (WIB for ID). | PLAN 2.12. |
| D-30 | Device support | Client portal: mobile first, 390 px and up, plus desktop. Insurer and Superadmin portals: 1024 px and up; below that they show a polite "use a larger screen" notice. | DESIGN.md 4 and 8.3. |
| D-31 | Language | English only. Indonesian proper nouns stay as they are, with an English gloss the first time on a screen. | Settled decisions; DESIGN.md 12. |
| D-32 | Background work | One `worker` service: APScheduler for schedules and a transactional outbox table for domain events. No Redis or broker in v2. | Fewer moving parts in Docker Compose. |
| D-33 | File storage | MinIO (S3 API) in Docker Compose. Evidence objects are never overwritten (new key per upload, bucket versioning on); the database stores SHA-256 and perceptual hash. | Write-once evidence. |
| D-34 | Sign-in | Phone or email plus a 6-digit one-time code. In the sandbox the code is delivered to the mock SMS or email inbox (a dev page lists messages). Sessions are opaque tokens stored server side in an httpOnly, Secure, SameSite=Lax cookie. The sign-in page shows one-tap demo accounts only when `SANDBOX=true`. | c01 design; revocable sessions. |
| D-35 | ID formats | Claim `CLM-YY-NNNNNN`, Policy `POL-<INS>-YY-NNNNNN`, Payout `PAY-YY-NNNNN`, Policy Record `PR-<INS>-<CODE>-YYYY`, Dispute `DSP-YY-NNNN`, Nudge `NDG-YY-NNNNN`. `<INS>` is the insurer code from the pack (JSD, ASK, SMI, ACA). Internal primary keys are UUIDv7. | PLAN data. |
| D-36 | Bench references | Damage Assessment accuracy for the ID pack: our pipeline vs GFM on the two Demak 2024 events (D-05). PH pack: vs PhilSA for Typhoon Inday (10–11 July 2026) and PhilSA's Nov 2025 maps on HDX (no UNOSAT product was found for Nov 2025). | Brief open decision plus D-05. |
| D-37 | Display rounding | Money is computed in `Decimal` and rounded half-up to the currency's display precision (IDR: whole rupiah) once per asset line; totals are sums of rounded lines. Ratios show 2 decimals with the pack's decimal separator. | Matches PLAN totals exactly. |
| D-38 | IDR minor unit | AiGRI stores IDR in whole rupiah (`minor_unit_exponent: 0` in the ID pack), although ISO 4217 lists 2 decimals for IDR. Rupiah has no subunits in use, and every demo figure is whole rupiah. Packs set the exponent per currency (PHP and THB: 2). | Avoids ×100 errors in fixtures and display. |

## Brief open decisions → where they are settled

| Brief open decision | Settled by |
| --- | --- |
| Confirm or replace the PCIC denied-claims study | Not a build concern; deck and docs keep it labelled "placeholder" (feature 18) |
| Hardest-hit province for Inday | Irrelevant to the ID demo (D-01, D-02); PH backtest uses PhilSA's mapped areas |
| How products split across insurers | D-02 (PLAN 2.5) |
| Nov 2025 backtest source | D-36 |
| Sentinel-1 GRD or RTC | D-27 |
| Open-Meteo free tier | D-27 |
| PAGASA has no API | PH pack only; parse through the quarantined reader (feature 09, planned pack) |
| θ | D-23 |
| Alert threshold | D-22 |
| Vulnerability tables and class edges | Versioned config in `risk/config/` and `damage/config/`, tuned on backtests (features 07, 10) |
| Who signs off a Curation formula version | D-28 |
| How per-source DA values combine into the loss % | D-08 (sources stay separate; assessed loss % proposed by a documented rule) |
| Default settlement window | D-17 |
| Automatic appeal draft | D-18 |
| Herd count frequency | D-24 |
| Issued → Active → Expired; cancellation | D-25 |
| Licensed wallet partner | Production only; sandbox mock wallet behind a partner-shaped adapter (feature 12) |
| Refund source on decline | D-16 |
| Withdrawals | D-26 |
| Payout hold after bank change | D-19 |
| Who assigns insurer roles | D-20 |
| OWASP ASI04 and ASI05 tests | Added to the red-team suite (feature 16): dependency pinning and hash check; no code execution tool exists, tested by attempting one |
| Underwriting-age Nudge threshold | D-21 |
| Bench case counts and pass bars | Feature 16 sets case counts; numeric pass bars for Q&A and DA stay "report as measured" until the first full run |
| Default model and hosted fallback | D-10 |

## Raised by agents

Add entries here as `R-NNN | date | feature | question | options | proposed default | status`. Do not delete answered entries; mark them `settled → D-NN`.

| ID | Date | Feature | Question | Options | Proposed default | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | 2026-10-20 | 12, 15 | PLAN 2.10's Jasindo wallet figures cannot all hold under double-entry: pre-funded Rp5.000.000.000 minus the Feb payouts before 24 Feb 08:30 (Rp197.600.000, derived from the 21 payouts totalling Rp412.600.000) is Rp4.802.400.000, yet the stated balance is Rp4.100.440.000, a gap of Rp701.960.000 before counting any premiums credited to the wallet (i06 also shows premium money-in). | (a) Premiums settle to the insurer's funding bank account, the wallet is a payout float, and the seed adds earlier payouts of Rp701.960.000 from a synthetic January event. (b) Keep premiums in the wallet and change the PLAN balances to whatever the ledger produces. (c) Add synthetic pre-season outflows. | (b): the ledger is the truth; the seed computes balances from movements and the i01, i06 and c13 screens show the computed values. Every other PLAN wallet figure (client balances, the three post-payout deltas) still holds. Update PLAN 2.10 numbers once seeded. | open |
