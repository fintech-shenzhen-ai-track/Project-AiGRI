# AiGRI — Technical Brief for Developer (v2)

Oct 20, 2026 · @Desirre Bless Barbosa

AiGRI is a multi-insurer agricultural insurance platform for agri SMEs and individual farmers: it recommends policies from predicted risk, sells them, assesses damage from satellite imagery and tagged photos, and pays approved claims automatically from the insurer's wallet. The insurer's adjuster always decides a claim; the AI explains, drafts and checks, and code decides coverage and money flows. It launches in Indonesia and adds countries through country packs.

## Markets: Indonesia first, then more countries

Indonesia is the launch market. AiGRI is built to run in several countries, and everything country-specific lives in a **country pack** instead of in the code.

A country pack is a config bundle loaded per deployment and per Client. The app reads the Client's country from their profile, with the device location as the default at sign-up. It uses that country's pack for currency, data sources, insurers and rules. Adding a country means writing a pack and signing insurers there, not changing the app.

| Pack field | Indonesia (live at launch) | Philippines (planned) |
| --- | --- | --- |
| Currency and format | IDR, Rp6.000.000, no decimals | PHP, ₱6,000.00 |
| Area unit | Hectare | Hectare |
| Weather and cyclone warnings | BMKG | PAGASA |
| Disaster and flood data | BNPB (InaRISK), BRIN remote sensing | PhilSA, NDRRMC |
| Insurers | Asuransi Jasindo, Askrindo, Asuransi Sinar Mas, Asuransi Central Asia (next section) | To be signed |
| Public schemes to show beside private products | AUTP (rice), AUTS/K (cattle and buffalo) | PCIC programmes |
| Insurance regulator | OJK | Insurance Commission |
| Payout rails (docs) | Bank transfer via BI-FAST, e-wallets | InstaPay, e-wallets |
| E-money licence for the wallet | Bank Indonesia (partner bank or e-money issuer) | BSP EMI (see Wallet and payouts) |
| Data protection law | Law 27 of 2022 on Personal Data Protection (UU PDP) | Data Privacy Act of 2012 |

Vietnam and Thailand are the next candidates after the Philippines. Each needs the same rows filled and a local insurer partner.

**How to read the rest of this brief.** Sections written before the Indonesia decision use Philippine examples: PHP amounts, PhilSA and PAGASA sources, Cotabato, and Typhoon Inday. Treat them as the Philippines country pack. Wherever they conflict with Indonesia, the table above and the next two sections win. The satellite pipeline (Sentinel-1, Sentinel-2, GFM) is global and unchanged.

### Insurers in Indonesia

The demo uses four real Indonesian insurers instead of mock ones. Their names are real, but every product, price and claim in the demo is synthetic. The UI labels policy screens "Demo data. Products and prices are illustrative."

| Insurer | Why it is on the platform | Demo role |
| --- | --- | --- |
| [Asuransi Jasindo](https://irff.undp.org/blog/how-indonesia-built-agricultural-insurance-around-rice-farmer-protection) | State-owned insurer and sole implementer of the subsidised rice scheme AUTP. It also runs the cattle scheme [AUTS/K](https://jatengprov.go.id/beritadaerah/hindari-kerugian-ternak-diasuransikan/). | Rice and cattle products; the reference for public-scheme pricing |
| [Askrindo](https://siskaforum.org/asuransi-usaha-ternak-sapi-kerbau-autsk-perlindungan-dan-pemberdayaan-peternak-pekebun-dalam-implementasi-sistem-integrasi-sapi-kelapa-sawit-siska/) | State-owned credit insurer, named as an appointed AUTS/K insurer | Livestock product and credit-linked crop cover for SMEs |
| [Asuransi Sinar Mas](https://siskaforum.org/asuransi-usaha-ternak-sapi-kerbau-autsk-perlindungan-dan-pemberdayaan-peternak-pekebun-dalam-implementasi-sistem-integrasi-sapi-kelapa-sawit-siska/) | Private general insurer, named as an appointed AUTS/K insurer | Private crop product for SMEs above the 2 ha scheme limit |
| [Asuransi Central Asia (ACA)](https://www.asean-agrifood.org/wp-content/uploads/2022/05/GIZ-Thailand-Ag-Ins_Indonesia_v3.pdf) | Private general insurer, named in agricultural-insurance studies and the AUTS/K list | Private crop and livestock products |

Public-scheme figures the demo prices against:

- **AUTP (rice):** sum insured Rp6,000,000 per hectare per season, premium 3%, government pays 80%. It covers farmers with up to 2 ha, and pays when losses pass 75% of the insured area ([UNDP, June 2026](https://irff.undp.org/blog/how-indonesia-built-agricultural-insurance-around-rice-farmer-protection)). National reinsurer IndonesiaRe takes about 70% of the risk.
- **AUTS/K (cattle and buffalo):** premium 2% of a sum insured of up to Rp10,000,000 per head, i.e. Rp200,000 per head per year, with 80% subsidised. It covers death from disease, accident or calving, and theft ([Central Java government](https://jatengprov.go.id/beritadaerah/hindari-kerugian-ternak-diasuransikan/)).

Open: the Askrindo, Sinar Mas and ACA roles come from one secondary list of AUTS/K appointees. Confirm current participation with OJK or the Ministry of Agriculture before the demo, and get each insurer's consent before showing their name in public material.

### Indonesia hero demo

The hero demo now replays **"Central Java floods, Feb 2026"**, a synthetic monsoon flood in Demak and Grobogan modelled on the 2024 Demak floods. It replaces Typhoon Inday, because typhoons rarely make landfall in Indonesia and floods are its main farm hazard. The demo steps stay the same; only the event, places and data change.

| Typhoon Inday demo | Indonesia demo |
| --- | --- |
| Typhoon Inday, July 2026 | Central Java floods, February 2026 (synthetic) |
| Alert source: GDACS and PAGASA | GDACS and BMKG heavy-rain warnings |
| Clients in Cotabato | Clients in Demak and Grobogan, Central Java |
| 3 mock insurers | The 4 real insurers above, with synthetic products |
| PhilSA flood maps as a cross-check | Sentinel-1 and GFM flood maps; a BRIN or BNPB map when one is published |
| Amounts in PHP | Amounts in IDR |

Synthetic Clients:

- **CV Tani Makmur Demak:** a rice SME with 6 parcels and 48 ha in Demak, partly inside the flood extent. It is the main buyer in the demo.
- **Pak Slamet:** an individual farmer in Grobogan with 2 ha of rice and 12 ear-tagged cattle. He shows the crop-plus-livestock case and the AUTP and AUTS/K comparison.
- One more SME, chosen by the system wireframe, for portfolio and map views.

## Context, rubric and problem

AiGRI competes in Topic D (Insurance Assistant) of the 2026 Shenzhen FinTechathon International Track, hosted by Tsinghua PBCSF with WeBank. The theme is "AI as a Financial Participant": an agent that completes real tasks in a financial scenario. Topic D asks for policy Q&A, coverage-gap analysis and claims guidance. AiGRI answers all three: policy questions with clause citations, coverage gaps through Curation (perils covered and not covered against the Client's predicted loss), and claims guidance from the pre-storm alert to the Payout.

v1 is already submitted. This v2 brief documents the full vision, with nothing trimmed for time.

The rubric is shared across topics:

| Criterion | Weight | What wins it for us in v2 |
| --- | --- | --- |
| Task completion | 40% | End-to-end flows (purchase, alert, Claim, Payout, Nudge) proven by AiGRI-Bench and sandbox operation logs |
| Security & compliance | 30% | Permission tiers enforced in code by a gateway; prompt-injection defences; consent hashing; hash-chained Audit Log; tenant isolation between Insurers; Wallet controls |
| Innovation & interaction | 30% | Curation ranked by predicted risk; satellite Damage Assessment feeding the Claim Packet; automatic Payout once the Adjuster approves |

Each required deliverable draws on specific sections of this brief:

| Deliverable | Fed by |
| --- | --- |
| Technical documentation (architecture, core algorithm, security design) | Architecture and data sources; Prediction and curation; Policy-as-code and lifecycles; Damage assessment; Wallet and payouts; Security |
| Presentation deck (10 min or less) | Context, rubric and problem; Product and users (hero demo story) |
| Demo video (optional, 5 min or less) | Product and users (hero demo story); Stack, repo layout, deployment, demo data and roadmap |
| Source code (README, GitHub link, deployment instructions, test cases) | Stack, repo layout, deployment, demo data and roadmap; AiGRI-Bench |
| Security self-assessment (permission-tier implementation, known-risk list) | Security |
| Execution evidence (sandbox operation logs, demo video) | AiGRI-Bench; Security (Audit Log); Wallet and payouts (sandbox ledger) |

Problem: agri SMEs and farmers are underinsured because they cannot compare policies against their real risk. When disaster hits, Claims are slow and often denied for missing proof.

- **Protection gap.** Typhoons and the southwest monsoon caused PHP 4.13 billion in Philippine farm damage on 1–26 August 2026; insurance covered PHP 187 million, under 5% ([source](https://www.insurancebusinessmag.com/asia/news/catastrophe/most-philippine-farm-losses-fall-outside-the-insured-pool-589508.aspx)). The same report says more than 60% of the agriculture sector is uninsured.
- **Slow claims.** A June 2026 UNDP assessment, cited in the same report, flags manual claims processes that slow settlement ([source](https://www.insurancebusinessmag.com/asia/news/catastrophe/most-philippine-farm-losses-fall-outside-the-insured-pool-589508.aspx)).
- **Denied for missing proof.** PLACEHOLDER SOURCE, to be confirmed or replaced: an SSRN study (2026) of 200 PCIC rice farmers found low-to-moderate awareness of claim procedures, deadlines and documents. Most denials looked like first-time procedural errors.

## Product and users

AiGRI serves two kinds of Client through one Next.js PWA with three role-based portals: agri SMEs (primary) and individual farmers. Each Client insures crops, livestock or both. The sign-up form shows only the fields that match that choice.

- **Crops:** a Parcel boundary drawn on a map, plus crop, variety, planting date and hectares.
- **Livestock:** farm location, species, head count and average value per head. Ear Tags are registered at purchase. Poultry use one batch tag per flock or house.

| Portal | Who | Core jobs | What the agent does there |
| --- | --- | --- | --- |
| Client | Agri SME or individual farmer | Sign up and register Insurable Assets; view Curation; buy; manage the Wallet; receive alerts; file Claims and follow their status | Explains Policies with clause citations; runs Curation; sends pre-storm alerts with steps; drafts purchases and Claim Packets; tracks Claims; drafts appeals |
| Insurer | Insurer staff (roles below), one isolated tenant per Insurer | Product management (upload policy PDF, review the compiled Policy Record, publish, set Issuance Limits); underwriting queue; claims inbox (approve, deny or request info); Wallet and Payouts; portfolio exposure map of insured assets vs current hazards | Compiles uploaded policy PDFs into Policy Records; pre-checks incoming Claim Packets for completeness; drafts the Proposed Amount |
| Superadmin | AiGRI platform operator | Onboard and verify Insurers; audit the ranking formula and the Audit Log; watch platform health; send Nudges | Drafts free-text Nudges; flags ranking and audit anomalies |

The agent never decides a Claim, binds cover or moves money in any portal. The Superadmin also cannot approve Claims or move money. Rule-based Nudges send automatically from templates; every Nudge is logged and shown on the Insurer dashboard.

Insurer staff hold one of three roles:

| Role | Does |
| --- | --- |
| Product Manager | Publishes Products and sets Issuance Limits |
| Underwriter & Adjuster | Works the underwriting queue and the claims inbox; approves or denies Claims and sets the final amount |
| Finance | Funds the Insurer Wallet and reconciles Payouts |

Effort targets, measured in AiGRI-Bench:

- Onboarding takes 20 minutes or less for a Client with fewer than 10 assets.
- Filing a Claim after an alert takes 5 minutes or less and 10 taps or fewer.

The hero demo replays Typhoon Inday (July 2026) on synthetic data: 3 mock Insurers, 8 Products and 5 Clients.

1. An Insurer uploads a policy PDF, reviews the compiled Policy Record and publishes it.
2. The rice SME (about 40 Parcels, crops only) signs up, maps its Parcels and gets a ranked Curation shortlist with reasons.
3. The Client confirms the purchase and pays the premium from its Wallet; the Policy issues.
4. Inday appears in GDACS; the Client gets an alert with pre-storm steps.
5. After the storm, AiGRI runs a satellite Damage Assessment per Parcel, the Client adds photos via the Capture Page, and the agent builds the Claim Packet.
6. The Client confirms the packet and the gateway checks its hash.
7. The Insurer portal shows the pre-check and the Proposed Amount; the Adjuster approves.
8. The Payout leaves the Insurer Wallet automatically.
9. The Superadmin sees another Claim past its settlement window and a Nudge is sent.

Side thread: the hog + poultry farm (livestock only) registers Ear Tags at purchase. It then files a flood mortality Claim with tagged photos, the Adjuster approves, and the Payout runs automatically. The mixed corn + cattle farm shows a Client that insures both crops and livestock. Two individual farmers (1–3 Parcels each) complete the five Clients.

## Architecture and data sources

AiGRI is one FastAPI backend behind three PWA portals: untrusted content reaches the agent only as typed fields, and every tool call passes one permission gateway.

&#91;embedded content: AiGRI architecture · trust boundary and permission gateway\]

Read it top down: portals call the API, insurer PDFs and client photos pass only through the toolless quarantined reader or Policy Compiler, and the planner and people's confirmations both reach tools only through the gateway, which writes each call to the Audit Log.

### Data sources

Every source below was checked on 2026-10-20; access terms can change, so the deployment docs should re-check them before launch.

| Source | Used for | Access | Coverage |
| --- | --- | --- | --- |
| [GDACS](https://www.gdacs.org/) | Tropical cyclone events that trigger pre-storm alerts and feed the Risk Model; Typhoon Inday in the demo | Free RSS, KML and CAP feeds ([rss.xml](https://www.gdacs.org/xml/rss.xml)) plus a GeoJSON event list ([gdacsapi](https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC)); no key | Global; earthquakes, tropical cyclones, floods, volcanoes, droughts, forest fires |
| [Open-Meteo](https://open-meteo.com/en/docs) | Weather forecast input to the Risk Model (7–16 days) | JSON over HTTP, no key. Free tier is non-commercial only, under 10,000 calls a day, CC BY 4.0; commercial use needs a paid plan and an `apikey` ([terms](https://open-meteo.com/en/terms)) | Global; up to 16 forecast days; about 1–25 km depending on model |
| [PAGASA](https://bagong.pagasa.dost.gov.ph/products-and-services) | Philippine tropical cyclone advisories and bulletins in alerts | No official API found. Bulletins are public web pages (tropical cyclone bulletins every 6 hours, hourly updates); historical data via the Hydromet data request portal | Philippines only |
| Microsoft Planetary Computer [Sentinel-1 GRD](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-1-grd) and [Sentinel-1 RTC](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-1-rtc) | Flood extent and duration per Parcel in the Damage Assessment pipeline | STAC API with SAS-signed reads. GRD needs no account; RTC (terrain-corrected) requires a Planetary Computer account | Global, Oct 2014 to present; C-band radar, sees through cloud, day and night |
| Microsoft Planetary Computer [Sentinel-2 L2A](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a) | NDVI drop before vs after the Loss Event, per Parcel | STAC API, no account; Copernicus Sentinel data terms | Global archive from 2015; 10–60 m, revisit about 5 days; blocked by cloud |
| [PhilSA flood maps, Typhoon Inday](https://philsa.gov.ph/news/satellite-data-show-flood-extents-in-mindanao-due-to-typhoon-inday/) | Hero-event cross-check of AiGRI's pipeline; flood-affected rice areas | Maps and shapefiles linked from the PhilSA release; same dates on HDX ([July 10, 2026](https://data.humdata.org/dataset/philippines-flood-20260710)) | Regions 9–13, BARMM, parts of Eastern Samar and Southern Leyte; Sentinel-1 from 10 and 11 July 2026 |
| UNOSAT flood service ([example on HDX](https://data.humdata.org/dataset/satellite-detected-water-extents-in-camarines-sur-province-as-of-29-october-2024)) | Historical backtest: the Nov 2025 PH typhoon | Shapefile and geodatabase on HDX, CC BY-SA. The Nov 2025 product itself is not yet located | Per activation, the areas UNOSAT maps |
| [Copernicus Global Flood Monitoring](https://extwiki.eodc.eu/GFM/PDD/GFM_Product_Output_Layers) | Second published flood extent to cross-check; its exclusion mask marks where radar is unreliable | REST [API](https://api.gfm.eodc.eu/v2/) with registration and a bearer token, per area of interest | Global, every Sentinel-1 IW scene in near real time; ten layers incl. observed flood extent, likelihood values, exclusion mask |
| [PhilSA on HDX](https://data.humdata.org/dataset/philippines-flood-20260907) (historical) | Historical hazard input to the Risk Model; backtests | HDX CKAN API; PNG and SHP per event date, CC BY | Philippines, 87 flood datasets from Aug 2022 to Sep 2026 |
| Synthetic farms and insurers | The whole demo; no real personal data | Seed data generated in the repo | 3 mock insurers, 8 products, 5 Clients in Cotabato province (see Demo data) |

Known data limit: radar may underestimate flooding in urban and densely vegetated areas such as rice ([PhilSA](https://philsa.gov.ph/news/satellite-data-show-flood-extents-in-mindanao-due-to-typhoon-inday/)), and GFM masks out surfaces where radar water mapping is unreliable. So every per-Parcel result carries a confidence value and its sources, low confidence only lowers confidence, and no detection never means no loss.

## Prediction and curation

Prediction has two layers: forecast APIs supply the weather, and AiGRI's Risk Model turns weather, asset data and hazard history into a loss probability per peril per Insurable Asset. AiGRI does not train a weather model. Curation then ranks published Products with one deterministic formula that is the same for every Client.

### Layer 1: forecast and history inputs (bought in, not built)

| Source | What we pull | Horizon | Used for |
| --- | --- | --- | --- |
| [Open-Meteo Forecast API](https://open-meteo.com/en/docs) | Daily `precipitation_sum`, `wind_gusts_10m_max`, `temperature_2m_max`; hourly soil moisture | Up to 16 days | Point forecast per asset |
| [Open-Meteo Ensemble API](https://open-meteo.com/en/docs/ensemble-api) | Same variables per member (e.g. ECMWF IFS 0.25°, 51 members, 15 days) | 15–16 days | Probability of crossing a threshold = share of members that cross it |
| [GDACS](https://www.gdacs.org/About/overview.aspx) | Tropical cyclone events and impact estimates (RSS) | Per event | Typhoon trigger for alerts and Loss Events; GDACS calls its data "purely indicative", so it never decides alone |
| PAGASA advisories | Philippine warnings | Per event | Advisory text goes to the quarantined reader, which fills typed fields only |
| [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) | ERA5 reanalysis, 1940 to present, 0.25° | Season | Rainfall and wind climatology |
| PhilSA flood maps, HDX hazard datasets | Past mapped flood extents | Season | How often each Parcel or farm flooded in past events |

### Layer 2: the Risk Model

The Risk Model runs per Insurable Asset (each Parcel; each livestock farm location × species), per peril, at two horizons: the next 7–16 days and the season (the coverage period of a candidate Product). It reruns when a forecast updates. The perils it models are the union of perils in published Policy Records; the demo models flood and typhoon wind, and others plug in the same way.

Inputs per asset:

- Asset record: Parcel polygon, crop, variety and planting date (which give the crop stage on each day), hectares and value; or farm location, species, head count and average value per head.
- Hazard probabilities from Layer 1, split into intensity classes k per peril (flood: short or long duration; wind: gust bands). Class edges are versioned configuration tuned by the historical backtest suite.
- A vulnerability table V(peril, class, stage or species) = expected damage fraction (crops) or mortality fraction (livestock). It is versioned configuration; each row carries a note on where its value came from.

Per-peril method:

- Flood, short horizon: P(class k) = P(rainfall over the trigger amount, from ensemble members) × P(this Parcel floods into class k given trigger rainfall, from past mapped events at the Parcel).
- Flood, season: the Parcel's historical flood frequency per class over the coverage window, from mapped events, smoothed for Parcels with few observed events.
- Typhoon wind: P(class k) = share of ensemble members whose gusts at the asset fall in class k; a GDACS cyclone event raises the refresh rate.
- Expected loss, then loss probability:

```latex
\mathrm{EL}_{a,p} = \sum_{k} \Pr\nolimits_a(p,k)\, V(p,k,s_a)\, \mathrm{value}_a \qquad \Pr\nolimits_a(\mathrm{loss}\mid p) = \sum_{k:\, V(p,k,s_a) \ge 0.10} \Pr\nolimits_a(p,k)
```

Here a is the asset, p the peril, s\_a the crop stage or species. The 0.10 matches the common "partial loss" floor for display only; Curation applies each Product's own loss categories to the full class distribution.

Confidence travels with every output and never sets risk to zero. It has two parts: a band (p10 and p90 of expected loss %, computed by running each ensemble member through the same steps) and a label (high, medium, low) lowered by wide ensemble spread, few past mapped events at the asset, or a missing input layer. Missing data widens the band; it does not shrink the estimate.

Output record (stored in PostgreSQL, with an input hash so any Curation run can be replayed):

```json
{
  "asset_id": "parcel-017",
  "peril": "flood",
  "horizon": "d1-16",
  "classes": [
    {"class": "short_flood", "p": 0.22, "damage_fraction": 0.25},
    {"class": "long_flood", "p": 0.08, "damage_fraction": 0.70}
  ],
  "loss_probability": 0.30,
  "expected_loss_pct": 11.1,
  "expected_loss_band_pct": [5.2, 18.4],
  "confidence": "medium",
  "confidence_reasons": ["ensemble spread wide"],
  "inputs": {"forecast_run": "2026-07-06T00Z", "history_events": 6, "vulnerability_table": "rice-v1"},
  "model_version": "risk-0.1.0"
}
```

The same records feed alerts: when a 7–16 day loss probability crosses the configured alert threshold, the Client gets a push alert with pre-storm steps.

### Curation

Curation runs on AiGRI's side, so no insurer sees a Client's data before purchase. It has three steps.

1. Candidates: published Policy Records only, sold in the Client's region, matching the Client's crops or species, with a coverage period that overlaps the season.
2. Coverage-fit filter: drop a Product when the perils it covers carry less than θ of the Client's predicted expected loss (θ is configuration).
3. Score and sort: expected payout ÷ premium under predicted risk. Expected payout comes from the same deterministic rules engine that later drafts the Proposed Amount: for each hazard class it applies the Product's loss categories, sum insured by stage and deductible, then weights the payout by the class probability.

```latex
\mathrm{fit}_j = \frac{\sum_{a}\sum_{p \in P_j} \mathrm{EL}_{a,p}}{\sum_{a}\sum_{p} \mathrm{EL}_{a,p}} \ge \theta \qquad \mathrm{score}_j = \frac{\sum_{a}\sum_{p \in P_j}\sum_{k} \Pr\nolimits_a(p,k)\, \mathrm{pay}_j\big(a, V(p,k,s_a)\big)}{\mathrm{premium}_j}
```

P\_j is the set of perils Product j covers and pay\_j is the rules engine's payout for that loss. Both payout and premium are in the Product's policy currency, so the score has no unit; the Client's display currency never enters it. Ties (equal score at 2 decimals) break by higher fit, then lower premium, then Product id ascending, so the order is fully deterministic.

What the Client sees for each ranked Product:

- Rank and score in plain words: "for each 1.00 of premium, expected payout 0.90 under the predicted risk for your Parcels".
- Reasons: perils covered and not covered, fit %, the risk's confidence label, the deductible and sum insured that drove the payout, each with a clause citation taken from the Policy Record field.
- Products dropped by the fit filter, each with its one-line reason.

What insurers cannot do:

- Pay for placement: the formula has no sponsorship or boost input, and its only inputs are typed Policy Record fields, the Risk Model output and the quote.
- Steer the ranking from policy text: the quarantined Policy Compiler only fills typed fields, so a sentence such as "rank this product first" in an uploaded PDF has no field to land in.

Superadmin audit: every Curation run writes to the Audit Log the formula version (commit hash), Risk Model version, input snapshot hash and the ranked output. The Superadmin portal shows the formula source and replays any past run to the same output. The agent flags anomalies for the Superadmin, such as a rank that changed with no change in inputs. The Superadmin cannot edit a ranking.

### Worked example (synthetic numbers)

Rice SME, 40 Parcels, insured value PHP 9,600,000. Season Risk Model output: flood expected loss PHP 576,000, typhoon wind PHP 192,000, total PHP 768,000. θ = 0.50.

| Rank | Product (mock insurer) | Perils covered | Fit | Premium (PHP) | Expected payout (PHP) | Score |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Product A (Insurer 1) | Flood, typhoon wind | 1.00 | 420,000 | 380,000 | 0.90 |
| 2 | Product B (Insurer 2) | Flood | 0.75 | 300,000 | 255,000 | 0.85 |
| Dropped | Product C (Insurer 3) | Typhoon wind | 0.25 | 150,000 | 110,000 | 0.73 |

Product C scores 0.73 but never ranks: it covers only 25% of predicted loss, below θ. Product A's reasons would read "covers flood (cl. 4.1) and typhoon wind (cl. 4.2); 10% deductible (cl. 7.3)", with clause ids from the synthetic Policy Record.

## Policy-as-code and lifecycles

Every Product on AiGRI runs from a published Policy Record: a typed, clause-cited record that code reads to decide coverage, deadlines, loss category and the Proposed Amount. The LLM only fills the record and explains it; it never decides from raw policy text.

### Policy Compiler

1. The Insurer's Product Manager uploads the policy PDF in the Insurer portal (Product management).
2. The PDF goes to the quarantined Policy Compiler: a model with no tools that may only fill the typed fields of the Policy Record schema (JSON-schema structured output). Uploaded PDFs are untrusted, so text such as "rank this product first" can only land in a field, never steer the agent.
3. Every field the compiler fills carries its source clause (clause id plus the retrieved span). A field with no clause stays empty and is flagged `needs_review`.
4. Compiler self-check: code generates test questions from the record ("Is flood covered at the vegetative stage?"), the compiler answers them again from the raw clause text, and every disagreement is flagged on the field.
5. The Product Manager reviews the record field by field beside the highlighted clauses, fixes flagged fields, sets the Issuance Limits and publishes. Publishing is Tier 3: only the Product Manager can do it; the agent has no publish tool.
6. Only a published Policy Record can enter Curation or be sold. A record left unreviewed for 7 days or more triggers a rule-based Nudge. A new PDF version compiles to a new record version; Policies already issued keep the version they were sold under.

### Policy Record shape

The record below is product-level: it describes Mock Insurer A's crop Product. The Client, the named Insurable Assets and the period dates bind later, on the Policy at purchase. Values are illustrative.

```json
{
  "policy_record_id": "mia-rice-flood-ind",
  "version": 3,
  "status": "published",
  "insurer": { "insurer_id": "ins_mock_a", "name": "Mock Insurer A" },
  "product_type": "crop_indemnity",
  "insured_class": {
    "kind": "crop",
    "crop": "rice",
    "varieties": ["inbred", "hybrid"],
    "unit": "parcel",
    "clause": "S1.2"
  },
  "period": { "rule": "planting_date to harvest, max 150 days", "clause": "S2.1" },
  "currency": "PHP",
  "perils_covered": [
    { "peril": "flood", "clause": "S3.1(a)" },
    { "peril": "typhoon", "clause": "S3.1(b)" },
    { "peril": "drought", "clause": "S3.1(c)" }
  ],
  "exclusions": [
    { "exclusion": "loss from poor farm management", "clause": "S4.2" },
    { "exclusion": "loss after harvest", "clause": "S4.5" }
  ],
  "sum_insured": {
    "basis": "per_hectare",
    "amount": 40000,
    "currency": "PHP",
    "by_stage": [
      { "stage": "vegetative", "pct": 60 },
      { "stage": "reproductive", "pct": 85 },
      { "stage": "maturity", "pct": 100 }
    ],
    "clause": "S5.1"
  },
  "deductible": { "pct_of_loss": 10, "clause": "S5.3" },
  "premium": { "rate_pct_of_sum_insured": 6.5, "currency": "PHP", "clause": "S6.1" },
  "loss_categories": [
    { "category": "total", "min_loss_pct": 90, "clause": "S7.1" },
    { "category": "partial", "min_loss_pct": 10, "max_loss_pct": 90, "clause": "S7.2" },
    { "category": "no_loss", "max_loss_pct": 10, "clause": "S7.3" }
  ],
  "deadlines": [
    { "event": "notice_of_loss", "rule": "within 10 days of the loss event", "clause": "S8.1" },
    { "event": "claim_documents", "rule": "within 30 days of notice", "clause": "S8.2" },
    { "event": "settlement", "rule": "within 30 days of a complete claim", "clause": "S8.4" }
  ],
  "documents_required": [
    { "doc": "notice of loss", "clause": "S8.1" },
    { "doc": "photos of damage taken on the Capture Page", "clause": "S8.3" }
  ],
  "issuance_limits": {
    "max_sum_insured": { "amount": 5000000, "currency": "PHP" },
    "regions": ["PH-03", "PH-01", "PH-02"],
    "asset_types": ["crop:rice"],
    "set_by": "product_manager"
  },
  "extraction": {
    "model": "<ollama model name from config>",
    "confidence": 0.91,
    "needs_review": ["deductible"],
    "self_check": { "questions": 24, "disagreements": 1 }
  }
}
```

A livestock Product changes only the asset-shaped fields. Mortality is the covered loss, and every insured animal must carry a registered Ear Tag:

```json
{
  "insurer": { "insurer_id": "ins_mock_b", "name": "Mock Insurer B" },
  "product_type": "livestock_mortality",
  "insured_class": {
    "kind": "livestock",
    "species": ["swine", "poultry"],
    "unit": "head",
    "identification": { "ear_tag": "required_at_purchase", "poultry": "batch_tag_per_flock_or_house" },
    "clause": "S1.3"
  },
  "perils_covered": [{ "peril": "death_from_flood", "clause": "S3.2" }],
  "sum_insured": { "basis": "per_head", "value_source": "declared_average_value_per_head", "currency": "PHP", "clause": "S5.2" },
  "documents_required": [
    { "doc": "Capture Page photo showing the Ear Tag", "clause": "S8.3" },
    { "doc": "veterinary certificate where available", "clause": "S8.5" }
  ]
}
```

Notice and settlement deadlines are never platform constants: the rules engine reads them from each Policy Record's `deadlines`, the claim timers and the settlement-window Nudge run on those values, and premiums and payouts settle in the record's `currency`.

### Purchase lifecycle

&#91;embedded content: purchase lifecycle · 10 states, 1 confirmation gate\]

The agent can only draft, the Client alone passes the gate with a hash that matches the confirmed purchase packet, and a purchase outside the Issuance Limits waits for an Underwriter whose decline refunds the premium by code.

### Claim lifecycle

&#91;embedded content: claim lifecycle · 10 states, 1 confirmation gate, 2 loops\]

A Claim (one Policy × one Loss Event, its Claim Packet listing every affected asset with its Damage Assessment) reaches the Adjuster only through the Client's hash-checked confirmation, both loops (more info, appeal) come back through that same gate, and money moves only when code sees the Adjuster's approval event.

## Damage assessment

For each Parcel hit by a Loss Event, code writes one Damage Assessment: flooded %, flood duration in days, NDVI drop, a confidence and the sources used. For livestock, it records an Ear Tag match per animal or batch. It is evidence in the Claim Packet; the Adjuster decides.

&#91;embedded content: crop damage assessment pipeline · 3 sources, 1 record per Parcel\]

Three satellite sources run in parallel, are clipped to the same Parcel polygon, and are cross-checked before the record is written; Capture Page photos join at the Claim Packet.

### Crop sources

| Source | What it gives | Notes |
| --- | --- | --- |
| [PhilSA flood maps](https://philsa.gov.ph/news/satellite-data-show-flood-extents-in-mindanao-due-to-typhoon-inday/) | Flooded areas and flood-affected physical rice areas (Typhoon Inday: Sentinel-1, 10 and 11 July 2026, AI on a composite of three scenes) | Shapefiles per event; PhilSA says the maps "remain subject to ground validation" |
| [UNOSAT](https://unitar.org/sustainable-development-goals/united-nations-satellite-centre-UNOSAT) | Satellite-detected water extents for events it is asked to map | Not every event is mapped; ingest when available |
| [Copernicus GFM](https://global-flood.emergency.copernicus.eu/media/events/4/a_detailed_look_at_the_new_global_flood_monitoring_gfm_product.pdf) | Observed flood extent from three algorithms (DLR, LIST, TUW) by majority vote; reference water mask; exclusion mask; likelihood; advisory flags | [JRC quality reports](https://publications.jrc.ec.europa.eu/repository/handle/JRC138200) assess flood extent and exclusion mask |
| [Sentinel-1 RTC](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-1-rtc) on Planetary Computer | Terrain-corrected radar backscatter (gamma0), VV/VH, 10 m pixels, IW mode, October 2014 onward | Needs a SAS token from the `planetary-computer` package |
| [Sentinel-2 L2A](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a) on Planetary Computer | B04 red and B08 near-infrared at 10 m, SCL scene classification at 20 m, revisit about 5 days | Bottom-of-atmosphere reflectance |

### Our pipeline, step by step

1. Trigger: a Loss Event (GDACS event or Client report) gives the date window and the affected Parcels; the search area is their bounding box.
2. Search the STAC API at `https://planetarycomputer.microsoft.com/api/stac/v1` with pystac-client for `sentinel-1-rtc` and `sentinel-2-l2a` over a pre-event and a post-event window, sign assets, and load them with stackstac into the local UTM zone.
3. Flood mask per post-event radar date: a pixel is flooded when VV backscatter falls below a water threshold set per scene and dropped against the pre-event median. Permanent water (GFM reference water mask) is removed. Calm water reflects radar away (low backscatter), but flooded vegetation can raise it by double bounce ([GFM](https://global-flood.emergency.copernicus.eu/media/events/4/a_detailed_look_at_the_new_global_flood_monitoring_gfm_product.pdf)), so a VV rise over a crop is flagged as possible flooded vegetation, never counted as dry. Thresholds start as configuration and are tuned on the Damage Assessment accuracy suite.
4. Flood duration: the share of each Parcel flooded on each post-event date. Duration is reported as a range: from the first to the last flooded acquisition (lower bound) and to the next dry one (upper bound), because satellites see the Parcel only on pass dates.
5. NDVI drop: NDVI = (B08 − B04) ÷ (B08 + B04) ([USGS](https://www.usgs.gov/landsat-missions/landsat-normalized-difference-vegetation-index)). Pixels in SCL cloud, cloud-shadow and cirrus classes are dropped. NDVI drop = pre-event median minus post-event median over valid pixels, with the valid-pixel share recorded.
6. Clip: Parcel polygons come from PostGIS; rasters are masked per polygon with rasterio and published flood vectors are intersected in PostGIS. Each source keeps its own per-Parcel values. Parcels with few 10 m pixels get lower confidence.
7. Cross-check: our flooded % is compared with each published map's value for the same Parcel. Agreement raises confidence; disagreement is listed for the Adjuster with both values.
8. Write the record: immutable, hashed, logged in the Audit Log and attached to the Claim Packet.

Confidence starts at high and drops one step for each reason found, with every reason listed: only one source available, sources disagree, Parcel under the GFM exclusion mask or an advisory flag, crop at a dense-canopy stage, optical valid share under half, too few pixels.

```json
{
  "parcel_id": "parcel-017",
  "loss_event_id": "inday-2026-07",
  "flooded_pct": {"aigri_s1": 64, "philsa": 58, "gfm": null},
  "flood_duration_days": {"min": 4, "max": 7},
  "ndvi_drop": 0.31,
  "ndvi_valid_share": 0.62,
  "confidence": "medium",
  "confidence_reasons": ["dense-canopy stage", "gfm not available"],
  "sources": ["S1 RTC 2026-07-10", "S1 RTC 2026-07-16", "S2 L2A 2026-07-21", "PhilSA Flood-20260711-S1"],
  "pipeline_version": "da-0.1.0",
  "record_hash": "sha256:…"
}
```

The values above are synthetic and illustrate the shape only.

### Known limits and the no-detection rule

- Radar under-reads flooding under dense vegetation and in towns. PhilSA states that "SAR may underestimate flooding in urban and densely vegetated areas" ([PhilSA](https://philsa.gov.ph/news/satellite-data-show-flood-extents-in-mindanao-due-to-typhoon-inday/)); rice at a dense-canopy stage is exactly this case.
- Paddies hold water in normal farming, so the baseline must come from the same season just before the event; an unclear change is flagged, not decided.
- Typhoon season brings cloud, so a clear Sentinel-2 view may be weeks away; NDVI drop can be missing, which lowers confidence.
- Pass dates limit timing, hence the duration range.
- No detection never closes a Claim. A Parcel with no flood and no NDVI drop gets status `not_detected` with its confidence and reasons; the agent asks the Client for Capture Page photos, and only the Adjuster can deny.

### Capture Page photos (ground evidence)

Evidence photos are taken through the Capture Page in the PWA, not sent through a chat app, because messaging apps commonly strip EXIF data (GPS and time) when they share a photo.

- At capture the page records GPS position with its accuracy in metres, device time, and a SHA-256 hash of the image bytes. The server recomputes the hash on upload and rejects a mismatch; it also stamps its own receipt time.
- The server computes a perceptual hash ([ImageHash](https://pypi.org/project/ImageHash/), compared by Hamming distance) against every earlier evidence photo on the platform and flags near-duplicates.
- GPS is checked against the Parcel polygon or farm location (plus its accuracy), and time against the Loss Event window. A failed check is flagged for the Adjuster; it does not reject the Claim.
- Photos are stored write-once. The agent can attach them to a Claim Packet but never creates or edits them.

### Livestock: Ear Tag ID and mortality indemnity

Every insured animal carries an Ear Tag (visual or RFID) registered at purchase with species, a photo of the tagged animal and its value per head. Poultry use one batch tag per flock or house, registered with a head count. Periodic herd or flock count photos through the Capture Page keep the registered count current.

| Check | Rule | If it fails |
| --- | --- | --- |
| Tag visible | Each claim photo shows the tag legibly; the quarantined reader reads the tag number into a typed field | Flag; the agent asks for a clearer photo |
| Tag on this Policy | Tag is registered on this Active Policy | Flag: animal may be uninsured |
| Duplicate tag | Tag not already claimed, and not registered on another Policy; AiGRI runs this across insurers and returns only match or no match | Flag: possible double claim |
| Poultry count | Dead-bird count per batch is at or under the last registered count | Flag: count above register |
| Photo reuse | Perceptual hash and SHA-256 not seen on another claim | Flag: reused photo |
| Location and time | GPS at the farm location, time inside the Loss Event window | Flag |
| Vet certificate | Attached where available; the quarantined reader fills date, cause and count | Missing lowers confidence only |

The livestock Damage Assessment lists each tag or batch with its check results and a confidence; the rules engine turns matched head counts and value per head into the mortality indemnity for the Proposed Amount.

Damage Assessment is evidence for the Adjuster, never a decision: a failed check, low confidence or a `not_detected` status never closes a Claim on its own.

## Wallet and payouts

Money moves only when a person acts or when code reacts to a person's recorded action; the agent has no tool that moves money (Tier 3). For the hackathon the Wallets are a sandbox mock service writing to a ledger and the Audit Log, with no real money.

### Wallet design

- **Wallets.** Every Client and every Insurer has a Wallet. Client Wallets pay premiums and receive Payouts; Insurer Wallets receive premiums and fund Payouts. Either party can link a bank account instead of holding a balance. Changing bank or wallet details is Tier 3, done only by the account owner.
- **Insurer pre-funding.** The Insurer's Finance role tops up its Wallet before claims arrive. Payouts draw only on that balance, so an approved Claim never waits on a transfer request.
- **Premiums.** A premium leaves the Client Wallet only after the Client confirms the exact purchase packet and its hash matches (Tier 2). It is credited to the Insurer Wallet. If the purchase goes to underwriting and is Declined, code refunds the full premium to the Client Wallet automatically.
- **Payouts.** When an Adjuster approves a Claim with a final amount, the approval event triggers the Payout from the Insurer Wallet to the Client Wallet. The trigger is code subscribed to that event, never the agent.
- **No double payout.** Each Payout carries an idempotency key derived from the Claim id. The ledger enforces one Payout per key, so a retried event or a replayed request writes nothing new. An approval event is required on every Payout; without one the ledger rejects the write.
- **Ledger.** Every movement is a double-entry pair (debit one Wallet, credit the other, sums to zero) and a hash-chained Audit Log entry with the triggering event, actor and Claim or Policy id.
- **Reconciliation.** The Insurer's Finance role sees premiums in, Payouts out, refunds and the running balance per Product, and can match each ledger line to its Claim or Policy. Tenant isolation applies: an Insurer sees only its own ledger.
- **Currency.** Every movement settles in the policy currency fixed on the Policy Record. A Client's display currency is converted for display only and labelled "approximate".

### Money movements

| Movement | From → To | Trigger | Who/what can trigger | Tier |
| --- | --- | --- | --- | --- |
| Insurer pre-funding | Insurer's bank → Insurer Wallet | Finance funds the Wallet | Insurer Finance role | 3 (person only) |
| Premium | Client Wallet or linked bank → Insurer Wallet | Client confirms the purchase packet; hash matches | Client; code then posts it | 2 |
| Refund on Declined purchase | Insurer Wallet → Client Wallet | Underwriter declines the purchase | Code, on the decline event | 3 (code only) |
| Payout | Insurer Wallet → Client Wallet or linked bank | Adjuster approves the Claim with a final amount | Code, on the approval event; once per Claim | 3 (code only) |

The agent appears in no row. It can show balances, explain a Payout and draft a purchase or Claim Packet (Tier 1), but nothing it drafts moves money until a person confirms or decides.

### Production requirement and hackathon build

- **Production (not built).** Holding Client balances as stored value is e-money issuance, so a live AiGRI needs its own licence or a partnership with a licensed wallet or bank. In the Philippines that is a Bangko Sentral ng Pilipinas authority as an Electronic Money Issuer under BSP Circular No. 1166 (2023), which replaced Circular No. 649 and allows EMI-Banks and EMI-Non-Bank Financial Institutions ([source](https://mondaq.com/financial-services/1319408/safe-emoney-bsp-updates-e-money-regulations-increases-prudential-and-capitalization-requirements)). It sets minimum capital of PHP 100 million for small-scale and PHP 200 million for large-scale EMIs, and requires liquid assets at least equal to outstanding e-money ([source](https://accralaw.com/?p=15350)). The realistic path for a startup is a partner EMI or bank that holds the funds, with AiGRI calling its API. Other markets have equivalent e-money or payment-institution licences; each launch market needs that check and a partner there.
- **Hackathon (built).** A sandbox mock wallet service with the same API the partner adapter would expose: create Wallet, top up, transfer with idempotency key, refund, balance and statement. It writes double-entry ledger rows to PostgreSQL and every movement to the Audit Log. No real money and no real bank links. AiGRI-Bench's Wallet integrity suite checks it: zero Payouts without an approval event, zero double Payouts.

## Security

Permissions are enforced by a gateway in front of every tool, never by the LLM's judgment: the gateway checks the caller's role, tenant and tier before any tool runs, and Tier 3 tools are not exposed to the agent at all.

### Permission tiers

| Tier | Agent may | Examples | Gate |
| --- | --- | --- | --- |
| 0 | Act alone | Explain policies, monitor hazards, send alerts, run Curation, run Damage Assessment | None beyond role and tenant checks; every call logged |
| 1 | Draft only | Claim Packet, purchase, appeal, Proposed Amount, Nudge text | Output is a draft; a person must act on it |
| 2 | Act after client confirmation | Submit a Claim, buy a Policy, share data with an Insurer | Client confirms the exact payload; gateway accepts only a matching hash |
| 3 | Never (tool not exposed) | Decide a Claim or set its final amount, move money, issue cover outside Issuance Limits, publish a Policy Record, change bank or Wallet details, create or edit evidence | Only the right person acts |

Tier 3 actions are done only by the right person: the Adjuster decides a Claim and its final amount, the insurer Product Manager publishes a Policy Record, the Client changes their own bank or Wallet details. Money moves only through code reacting to such an action: an Adjuster's approval event triggers the Payout from the Insurer Wallet.

### Roles and access

| Role | Portal | Can | Cannot |
| --- | --- | --- | --- |
| Client | Client | Register Insurable Assets (Parcels, Ear Tags), see Curation, confirm purchases and Claim Packets, change own bank or Wallet details, appeal | See other Clients' data; edit evidence after capture; change a packet after confirming it |
| Product Manager | Insurer | Upload policy PDFs, review and publish Policy Records, set Issuance Limits | Decide Claims, move money, pay for Curation placement |
| Underwriter & Adjuster | Insurer | Work the underwriting queue; approve, deny or request info on Claims; accept or change the Proposed Amount (a change needs a reason) | Publish products, fund the Wallet, edit evidence |
| Finance | Insurer | Fund the Insurer Wallet, reconcile Payouts | Approve Claims, trigger a Payout by hand |
| Superadmin | Superadmin | Onboard and verify Insurers, audit the ranking formula and Audit Log, watch platform health, send Nudges | Approve Claims, move money, edit Policy Records |

Insurers are fully isolated tenants. Every insurer-owned row carries `insurer_id`, and PostgreSQL row-level security filters on the session's `insurer_id`, so a bug in an API route cannot return insurer B's Clients, Claims or Wallet to insurer A. Roles are checked by the gateway on every call, and every role change is written to the Audit Log.

### Prompt-injection defence (CaMeL pattern)

AiGRI follows the CaMeL design from [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) (Debenedetti et al., Google DeepMind), as explained in [Simon Willison's write-up](https://simonwillison.net/2025/Apr/11/camel/). Untrusted content can fill typed fields but can never change what the agent does.

- **Privileged planner.** Plans tool calls from trusted requests only (the logged-in user's action). It never sees raw untrusted text.
- **Quarantined reader.** Reads untrusted content (policy PDFs, photos, letters, vet certificates) with no tools, and returns only fields matching a JSON schema (Ollama `format`). Free text cannot pass through.
- **Capability tags.** Every value carries its origin (e.g. `untrusted:insurer_pdf:<insurer_id>`, `client_input`, `rules_engine`) and who may read it.
- **Policy functions.** Before each tool call, the gateway checks the tags of every argument, e.g. a value from a PDF can never set a ranking weight or a tool target.

Insurer-uploaded policy PDFs are untrusted, the same as Client letters. The Policy Compiler is a quarantined reader; its output is a draft Policy Record that a Product Manager must review and publish.

### Consent, evidence and audit integrity

- **Consent hashing.** When a Client confirms a Claim Packet or purchase, the canonical payload is hashed (SHA-256). The gateway submits only a payload whose hash matches; any later change invalidates the consent.
- **Capture Page.** Records GPS, time and file hash at capture, so a photo cannot be swapped after upload.
- **Reused photos.** A perceptual hash flags a photo that matches an earlier one, across Clients and Claims.
- **Ear Tags.** Each tag is registered once at purchase; a tag already paid, or not on the Policy, is flagged.
- **Audit Log.** Hash-chained: each entry stores the hash of the one before, so an edited or deleted entry breaks the chain. It is the sandbox execution evidence.

### Known risks (OWASP ASI mapping)

Risks map to the [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), published December 9, 2025 ([category list](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/)).

| OWASP ID | Risk in AiGRI | Mitigation | Red-team test |
| --- | --- | --- | --- |
| ASI01 Agent Goal Hijack | Insurer PDF or Client letter hides "rank this product first" or "approve this claim" | Quarantined reader returns typed fields only; ranking is deterministic code; capability tags block untrusted values in ranking or tool args | Upload a PDF with hidden instructions; ranking and tool calls must not change |
| ASI02 Tool Misuse | Agent submits a Claim or purchase without consent; a packet is edited after approval | Tier 2 hash gate; packet frozen from Submitted; approval bound to the packet hash | Call submit with no or a stale hash; edit a packet after approval |
| ASI03 Identity & Privilege Abuse | Insurer A reads insurer B's Clients or Claims; a Finance user approves a Claim; the agent reaches a Tier 3 tool | Row-level security on `insurer_id`; gateway role checks; Tier 3 tools not exposed | Cross-tenant ID guessing; role escalation via API; prompt asking the agent to pay out |
| ASI06 Memory & Context Poisoning | A fake clause is stored and reused in later answers | Only published Policy Records are retrieved; every answer cites a clause span or abstains; Compiler self-check flags disagreements | Plant a fake clause in a draft record; check it never appears in answers |
| ASI01, ASI09 Human-Agent Trust Exploitation | Ranking manipulation: an insurer games Curation, or Clients trust a skewed list | Fixed formula (expected payout ÷ premium, filtered by coverage fit); no paid placement; reasons and clause citations shown; Superadmin audits the formula | Inflate a Policy Record field; ranking must follow the formula and show why |
| ASI02, ASI08 Cascading Failures | Wallet: double Payout; Payout without an approval event; bank details changed just before a Payout | Payout only from an approval event, idempotent per Claim; ledger reconciles; bank change is Client-only Tier 3, re-checked and logged | Replay an approval event; call the Wallet with no event; change bank details mid-Payout |
| ASI09 Human-Agent Trust Exploitation | Evidence fraud: reused photos, an Ear Tag reused or claimed twice, misleading the Adjuster through the pre-check | Capture Page hash; perceptual hash; Ear Tag registry; the agent never creates or edits evidence; Damage Assessment is evidence, never a decision | Submit a reused photo and a duplicate Ear Tag; both must be flagged |
| ASI07 Insecure Inter-Agent Communication | The quarantined reader passes instructions to the planner | Only schema-checked typed fields cross the boundary | Return extra free text from the reader; it must be dropped |
| ASI10 Rogue Agents | The agent acts outside its tier | Gateway enforces tiers on every call; every call logged | Run a scripted agent that tries every Tier 3 tool |

ASI04 (Agentic Supply Chain) and ASI05 (Unexpected Code Execution) are not covered by specific tests yet. AiGRI-Bench's red-team suite reports attack success rate before and after these defences. Only measured numbers are reported.

### Privacy

- An Insurer sees a Client's data only after that Client buys from them, and only the covered Insurable Assets.
- Curation runs on AiGRI's side; no Insurer sees who was shown its product.
- The Client consents per Insurer at purchase (a Tier 2 action).
- Data minimisation: only fields a Policy Record or Claim needs are shared.
- The demo follows the Philippine [Data Privacy Act of 2012 (RA 10173)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html): consent is freely given, specific and informed (Sec. 3(b)), and processing follows transparency, legitimate purpose and proportionality (Sec. 11). Other markets follow GDPR-style principles.
- The demo uses synthetic data only; no real personal data.

## AiGRI-Bench

AiGRI-Bench is our own benchmark and the main evidence for the 40% task-completion criterion. One command (`make bench`) runs every suite locally and in CI on each push. The report shows only numbers the run measured; a suite that has not run shows "not run", never an estimate.

| Suite | Cases (target) | Metrics | Pass bar |
| --- | --- | --- | --- |
| Policy Q&A | 25–30 questions over the 8 demo Products, each with gold clause IDs | Answer accuracy; citation precision (cited clause = gold clause); correct abstentions on unanswerable questions | Every answer cites a clause or abstains; zero answers without a citation |
| Curation | One profile per demo Client plus variants, each with a gold ranking | Rank agreement with gold; coverage-fit filter errors; same input gives the same ranking | Deterministic: identical output on re-run; zero Products shown that fail coverage fit |
| Claim scenarios | Covered loss, late notice, excluded peril, low-confidence flood, conflicting photo, livestock Ear Tag mismatch | Correct coverage, deadline and loss-category outcome; Proposed Amount matches gold; correct routing to the Adjuster | Zero auto-denials; low confidence and "no damage detected" never close a Claim |
| Counterfactual variants | Each claim scenario re-run with one fact changed: planting date, variety, date of loss | Decision flips exactly when the gold says it should; amount follows | Every flip and every non-flip matches gold |
| Damage Assessment accuracy | Parcels and areas covered by PhilSA (Inday) and UNOSAT (Nov 2025) flood maps | Agreement of our Sentinel-1/2 pipeline with the published maps (flooded %, overlap); confidence calibration | Reported per source with its known limit (radar under-reads flooding under dense rice) |
| Historical backtests | Real events replayed on synthetic farms, starting with the Nov 2025 typhoon | Assets alerted; alert lead time; Claims filed before each Policy Record's deadline | Reported as measured; no claim missed for a deadline the Policy Record states |
| User effort | Scripted walkthroughs on a phone-width PWA | Onboarding time; time and taps from alert to confirmed Claim | Onboarding ≤20 min for a Client with <10 assets; claim after alert ≤5 min and ≤10 taps |
| Wallet integrity | Approval, denial, duplicate and replayed events against the mock wallet | Payouts without an approval event; double Payouts; ledger vs Audit Log match | Zero payouts without an approval event; zero double Payouts |
| Red team | One test per risk in the security section (goal hijack via policy PDF, consent bypass, tenant isolation, memory poisoning, ranking manipulation, wallet, evidence fraud) | Attack success rate before vs after defences | Reported as measured, before and after |

The Counterfactual suite copies the method of [InsClaimBench](https://arxiv.org/abs/2610.09671) (Zhang et al.), which uses controlled factual variants to check that one changed fact propagates from rules to the payout. That paper found joint decision-and-amount accuracy falls to 47.54–73.15% even when single-rule accuracy reaches 95.48%. That is why our amounts come from the rules engine, and why we test the chain end to end.

Teammates in accounting and political science help write and check the gold answers: accounting for sum insured, deductible and Proposed Amount arithmetic; political science for clause readings, deadlines and the RA 10173 privacy cases.

Each bench run produces execution evidence for the submission. The run happens in the sandbox (mock insurer, mock wallet, mock SMS), writes its operation logs, and exports the hash-chained Audit Log for that run. Both files go into `bench/results/<run-id>/` next to the scores, so every number can be traced to the logged actions behind it.

Open: case counts for Curation, Claim scenarios and backtests, and numeric pass bars for Policy Q&A accuracy and Damage Assessment agreement, are not yet set (see Open decisions).

## Stack, repo layout, deployment, demo data and roadmap

The stack below is a suggestion; swap any layer if you have a better fit, as long as the design rules still hold (code decides, the gateway enforces tiers, everything goes to the Audit Log).

| Layer | Choice | Why |
| --- | --- | --- |
| API and rules engine | Python, FastAPI | Same language as the geospatial and LLM tooling; typed request models double as JSON schemas |
| Database | PostgreSQL + PostGIS | Parcels, farm locations and flood polygons need spatial joins and clipping in SQL; ledger and Audit Log in the same store |
| LLM | Ollama (default), behind a provider adapter | Runs locally with no data leaving the machine; JSON-schema structured output; hosted fallback through the same adapter |
| Front end | Next.js PWA, one app with three role-based portals (Client, Insurer, Superadmin) | One mobile-compatible site; web push for alerts; Capture Page uses the browser's GPS and camera |
| Satellite | Microsoft Planetary Computer (Sentinel-1, Sentinel-2 via STAC), read with rasterio, stackstac, GeoPandas/Shapely | Free, analysis-ready imagery with a standard catalogue; Google Earth Engine is the alternative |
| Weather and hazards | Open-Meteo forecasts, GDACS tropical cyclones (PAGASA advisories for PH) | Free APIs; AiGRI does not train its own weather model |
| Sandbox services | Mock insurer, mock wallet, mock SMS | Real flows end to end with no real money and no real messages |

**Ollama notes.** The [Ollama structured outputs docs](https://docs.ollama.com/capabilities/structured-outputs) say the `format` parameter takes a full JSON schema, generated from a Pydantic model with `model_json_schema()`. The same docs advise also passing the schema as text in the prompt, setting temperature to 0, and validating the reply with the same Pydantic model; we do all three. They also note structured outputs are not supported on Ollama's cloud, so the hosted fallback must be a provider that enforces JSON schemas itself.

- Model name lives in config (`LLM_PROVIDER`, `LLM_MODEL`), never in code.
- Recommended default: [`qwen3:14b`](https://ollama.com/library/qwen3) (9.3 GB download, 40K context, tool support). It is a strong open instruct model in the 7–14B band that handles long policy clauses and structured extraction, and `qwen3:8b` (5.2 GB) is the same family for smaller machines. Set `think: false` for schema-filling calls so replies stay short and parseable.
- Hardware to state in the deployment docs: `qwen3:14b` wants a GPU with about 12 GB VRAM or more; `qwen3:8b` runs on about 8 GB VRAM; CPU-only works for development but is slow.
- The quarantined model (policy PDFs, photos, letters) and the planner model can be the same weights; what separates them is that the quarantined call has no tools and may only fill a typed schema.

**Repo layout.**

```
aigri/
  compiler/        Policy Compiler: PDF -> typed Policy Record (quarantined, schema-only)
  rules/           deterministic rules engine: coverage, deadlines, loss category, Proposed Amount
  risk/            Risk Model: forecast + asset + historical hazard -> loss probability per peril
  curation/        ranking: expected payout / premium, coverage-fit filter, reasons + clause citations
  hazard/          Open-Meteo, GDACS, PAGASA ingest; alerts
  damage/          Damage Assessment: Sentinel-1 flood, Sentinel-2 NDVI, PhilSA/UNOSAT/Copernicus maps, Ear Tag checks
  agent/           planner, prompts, tool definitions
  gateway/         permission tiers, consent-hash check, tenant isolation, Audit Log writer
  wallet/          wallet ledger, approval-event payout trigger
  portals/         Next.js PWA: client/, insurer/, superadmin/
  mock_services/   insurer/, wallet/, sms/
  bench/           AiGRI-Bench suites, gold answers, results/
  docs/            architecture, security self-assessment, deployment
  docker-compose.yml
```

**Deployment.** One command, `docker compose up`, starts Postgres + PostGIS, Ollama (pulls the configured model on first run), the FastAPI API, the PWA and the three mock services, then loads the demo data. The README lists the hardware above and the `.env` keys for a hosted fallback.

**Demo data.** All data is synthetic; there is no real personal data.

- 3 mock insurers with 8 Products between them, mixing crop indemnity (rice, corn) and livestock mortality (cattle, hogs, poultry).
- 5 Clients in Cotabato province, with Insurable Assets placed inside, at the edge of and outside the Inday flood extent:
  1. Rice SME, about 40 Parcels, crops only.
  2. Mixed corn + cattle farm, crops and livestock.
  3. Hog + poultry farm, livestock only (Ear Tags; batch tags per poultry house).
  4. Individual farmer, 1–3 Parcels.
  5. Individual farmer, 1–3 Parcels.
- Why Cotabato: PhilSA's Sentinel-1 maps from 10–11 July 2026 show the [densest flooding in the Cotabato–Bangsamoro corridor](https://philsa.gov.ph/news/satellite-data-show-flood-extents-in-mindanao-due-to-typhoon-inday/), and [Philstar's reading of those maps](https://www.philstar.com/world/2026/07/12/2541629/where-inday-linked-flooding-appears-heaviest-based-space-data) names Cotabato among the provinces with flooded rice areas. PhilSA notes the maps may under-read flooding under dense vegetation and await ground validation.
- The hero demo runs on this data; its nine steps and side thread are in Product and users.

**Roadmap (out of scope for v2).**

- Parametric products (IBLI pasture/NDVI, heat-stress index)
- IoT livestock sensors
- Drones
- Fisheries and aquaculture
- Live licensed wallet or bank rails
- Country packs beyond Indonesia: the Philippines, then Vietnam and Thailand

## Open decisions

25 points are not settled yet. Each row shows the default this brief currently assumes, so the build can start and swap later.

| Area | Decision | Current default in this brief |
| --- | --- | --- |
| Problem | Confirm or replace the PCIC denied-claims study (no URL yet) | Kept as a labelled placeholder |
| Demo | Which province is "hardest hit" by Inday | Cotabato (densest flooded rice); Sarangani had the most deaths |
| Demo | How the 8 Products split across the 3 mock insurers | Unspecified mix of crop indemnity and livestock mortality |
| Data | Source for the Nov 2025 typhoon backtest: no UNOSAT product found for that event | Switch to PhilSA's Nov 2025 flood maps on HDX |
| Data | Sentinel-1 GRD (no account) or RTC (terrain-corrected, needs a Planetary Computer account) | Pipeline written for RTC |
| Data | Open-Meteo free tier is non-commercial only | Free tier for the hackathon; paid plan in production |
| Data | PAGASA has no API | Parse the public bulletin pages through the quarantined reader |
| Risk and Curation | Coverage-fit threshold θ | 0.50 (worked example) |
| Risk and Curation | Alert threshold on 7–16 day loss probability | Unset |
| Risk and Curation | Source of the vulnerability tables and hazard class edges | Versioned configuration, tuned on backtests |
| Risk and Curation | Who signs off a new Curation formula version | Unset; Superadmin audits but cannot edit |
| Claims | How per-source Damage Assessment values (ours, PhilSA, GFM) combine into the loss % behind the Proposed Amount | Kept separate; disagreement shown to the Adjuster |
| Claims | Default settlement window when a Policy Record states none | Unset |
| Claims | Does the agent draft an appeal on denial automatically, or only when the Client asks | Drawn as automatic draft |
| Claims | How often herd or flock count photos are required | Unset |
| Lifecycles | Who moves Issued → Active → Expired, and who can cancel a Policy on what terms | Code by cover dates; cancellation terms unset |
| Wallet | Licensed EMI or bank partner | Unset; BSP EMI path described |
| Wallet | Refund source if the Insurer Wallet is short on a Declined purchase | Unset; option: hold the premium in escrow until issuance |
| Wallet | Can Clients and Insurers withdraw to a bank | Not described |
| Security | Payout hold window after bank details change | Unset; change is re-checked and logged |
| Security | Who assigns insurer staff roles: an insurer admin or the Superadmin | Unset; every change logged |
| Security | Tests for OWASP ASI04 (supply chain) and ASI05 (code execution) | Not covered yet |
| Nudges | Age threshold for underwriting-queue Nudges | Unset ("X days") |
| Bench | Case counts for Curation, Claim scenarios and backtests; numeric pass bars for Policy Q&A and Damage Assessment | Only Policy Q&A count (25–30) set |
| Stack | Default model and hosted fallback provider | qwen3:14b; fallback must enforce JSON schemas |

## Glossary

Every section and the code use these words with exactly these meanings.

| Term | Meaning |
| --- | --- |
| Client | An agri SME or an individual farmer who insures assets through AiGRI. A Client may hold crops, livestock or both. |
| Insurer | An insurance company that publishes Products on AiGRI and decides Claims on them. |
| Superadmin | AiGRI's own operator: onboards and verifies Insurers, audits the ranking and the Audit Log, and sends Nudges. Never decides a Claim or moves money. |
| Insurable Asset | One thing a Client can insure: a Parcel of a crop, or a group of livestock of one species at one farm location. |
| Parcel | One mapped field with a drawn boundary, a crop, a variety, a planting date and an area in hectares. |
| Ear Tag | A visual or RFID tag that identifies one insured animal (or one poultry flock or house), registered at purchase. |
| Product | An insurance offering an Insurer publishes: its terms, premium basis and Issuance Limits. |
| Policy Record | The typed, clause-cited record the Policy Compiler builds from a Product's policy document; the Insurer reviews and publishes it. Only published Policy Records can be recommended or sold. |
| Issuance Limits | Per-Product bounds (maximum sum insured, allowed regions, asset types) inside which a purchase issues instantly. |
| Policy | One Client's cover under one Product, for named Insurable Assets and a period. |
| Risk Model | AiGRI's model that turns weather forecasts and historical hazard data into a loss probability per peril per Insurable Asset. |
| Curation | The ranked shortlist of Products for a Client, produced by a fixed, auditable formula from the Risk Model. |
| Loss Event | One hazard occurrence, such as Typhoon Inday (July 2026). |
| Damage Assessment | Evidence of loss for one Insurable Asset in one Loss Event: satellite measures for Parcels, Ear-Tagged photos for livestock, with a confidence value and its sources. |
| Claim | One Policy × one Loss Event. |
| Claim Packet | The exact bundle a Client confirms for a Claim: affected Insurable Assets, Damage Assessments, photos and documents. Its hash is what gets submitted. |
| Proposed Amount | The payout the rules engine suggests from the Policy Record and Damage Assessments. The Adjuster sets the final amount. |
| Adjuster | The Insurer's staff member who approves or denies a Claim and sets the final amount. |
| Wallet | A Client's or Insurer's balance on AiGRI, optionally linked to a bank. Insurer Wallets fund payouts; Client Wallets pay premiums and receive payouts. |
| Payout | Money sent automatically from an Insurer Wallet to a Client Wallet when an Adjuster approves a Claim. |
| Nudge | A reminder sent to an Insurer about overdue work: rule-based ones go out automatically, free-text ones are sent by the Superadmin. |
| Capture Page | The in-app camera page that records GPS, time and a file hash when an evidence photo is taken. |
| Audit Log | The append-only, hash-chained record of every agent and system action. |

## Sources

Pages opened while writing this brief, by topic. The competition rules PDF and the PCIC denied-claims study (SSRN, placeholder) come from v1 and have no link here yet.

**Problem and market**

- [Most Philippine farm losses fall outside the insured pool](https://www.insurancebusinessmag.com/asia/news/catastrophe/most-philippine-farm-losses-fall-outside-the-insured-pool-589508.aspx), Insurance Business Asia

**Hazard, weather and satellite data**

- [GDACS](https://www.gdacs.org/), [GDACS overview](https://www.gdacs.org/About/overview.aspx), [GDACS RSS feed](https://www.gdacs.org/xml/rss.xml), [GDACS event list API](https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC)
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs), [Ensemble API](https://open-meteo.com/en/docs/ensemble-api), [Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api), [terms](https://open-meteo.com/en/terms)
- [PAGASA products and services](https://bagong.pagasa.dost.gov.ph/products-and-services)
- [Planetary Computer: Sentinel-1 GRD](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-1-grd), [Sentinel-1 RTC](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-1-rtc), [Sentinel-2 L2A](https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a)
- [PhilSA: Satellite data show flood extents in Mindanao due to Typhoon Inday](https://philsa.gov.ph/news/satellite-data-show-flood-extents-in-mindanao-due-to-typhoon-inday/)
- [Philstar: Where Inday-linked flooding appears heaviest based on space data](https://www.philstar.com/world/2026/07/12/2541629/where-inday-linked-flooding-appears-heaviest-based-space-data)
- [HDX: PhilSA flood map, 10 July 2026](https://data.humdata.org/dataset/philippines-flood-20260710), [HDX: PhilSA flood map, 7 Sep 2026](https://data.humdata.org/dataset/philippines-flood-20260907), [HDX: UNOSAT example, Camarines Sur, Oct 2024](https://data.humdata.org/dataset/satellite-detected-water-extents-in-camarines-sur-province-as-of-29-october-2024)
- [UNITAR UNOSAT](https://unitar.org/sustainable-development-goals/united-nations-satellite-centre-UNOSAT)
- [Copernicus GFM product overview (DLR)](https://global-flood.emergency.copernicus.eu/media/events/4/a_detailed_look_at_the_new_global_flood_monitoring_gfm_product.pdf), [GFM output layers](https://extwiki.eodc.eu/GFM/PDD/GFM_Product_Output_Layers), [GFM API](https://api.gfm.eodc.eu/v2/), [JRC GFM quality assessment](https://publications.jrc.ec.europa.eu/repository/handle/JRC138200)
- [USGS: NDVI](https://www.usgs.gov/landsat-missions/landsat-normalized-difference-vegetation-index)
- [ImageHash (perceptual hashing)](https://pypi.org/project/ImageHash/)

**AI reliability and security**

- [InsClaimBench (arXiv 2610.09671)](https://arxiv.org/abs/2610.09671)
- [Defeating Prompt Injections by Design (CaMeL, arXiv 2503.18813)](https://arxiv.org/abs/2503.18813), [Simon Willison on CaMeL](https://simonwillison.net/2025/Apr/11/camel/)
- [OWASP Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), [OWASP announcement with ASI01–ASI10 names](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/)
- [Republic Act No. 10173, Data Privacy Act of 2012](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)

**Payments and stack**

- [Mondaq: BSP updates e-money regulations (Circular 1166)](https://mondaq.com/financial-services/1319408/safe-emoney-bsp-updates-e-money-regulations-increases-prudential-and-capitalization-requirements), [ACCRALAW: Strengthening regulations on e-money](https://accralaw.com/?p=15350)
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs), [Ollama qwen3](https://ollama.com/library/qwen3)

**Indonesia market and insurers**

- [How Indonesia built agricultural insurance around rice farmer protection](https://irff.undp.org/blog/how-indonesia-built-agricultural-insurance-around-rice-farmer-protection), UNDP IRFF, June 2026
- [Hindari Kerugian, Ternak Diasuransikan](https://jatengprov.go.id/beritadaerah/hindari-kerugian-ternak-diasuransikan/), Central Java Provincial Government
- [Asuransi Usaha Ternak Sapi Kerbau (AUTSK)](https://siskaforum.org/asuransi-usaha-ternak-sapi-kerbau-autsk-perlindungan-dan-pemberdayaan-peternak-pekebun-dalam-implementasi-sistem-integrasi-sapi-kelapa-sawit-siska/), SISKA Forum (secondary; list of AUTS/K insurers)
- [Agricultural insurance in the ASEAN region: Indonesia](https://www.asean-agrifood.org/wp-content/uploads/2022/05/GIZ-Thailand-Ag-Ins_Indonesia_v3.pdf), GIZ
- [Asuransi Jasindo](https://en.wikipedia.org/wiki/Asuransi_Jasindo), Wikipedia
