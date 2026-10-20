# 15 Seed and demo: spec

## Summary

All demo data is synthetic and comes from one place. `system-preview/PLAN.md` section 2 is the source; this feature turns it into fixture files and a story script that builds the demo by calling the real services along the story timeline, with the demo clock moved at each step. Because the data is created through the services, the Audit Log chain, packet hashes and ledger are real, and every screen shows numbers that the code produced. Presenters can jump to checkpoints along the story.

## User stories

**US-15.1 Seed once, demo anywhere.** As a presenter, I run `make seed` and every screen in the three portals shows the PLAN story data on its story date.

**US-15.2 Jump to a moment.** As a presenter, I run `make demo-checkpoint NAME=alert-morning` and the platform is at 4 Feb 2026, 06:15 WIB with the alert just sent.

**US-15.3 Gold figures hold.** As a developer, the gold tests in features 05, 07, 11 and 12 pass against the seeded data without special cases.

## Functional requirements

- **FR-15.1** Fixtures in `seed/fixtures/` transcribe PLAN section 2 exactly: country pack data (2.1, already in `packs/`), hero event (2.2), clients and assets (2.3), people (2.4), Policy Records (2.5), Curation inputs (2.6), policies (2.7), hero claim and its timeline (2.8), other claims (2.9), insurer wallet (2.10), portfolio (2.11), platform (2.12). Where PLAN gives a figure, the fixture uses it unchanged; where it does not, the fixture marks the value `synthetic: true` with a one-line note.
- **FR-15.2** Policy documents: generate one synthetic PDF per Policy Record (8) from Markdown clause templates (`seed/policies/*.md`) whose clause numbers and texts match PLAN and the c06/c07/i02/a03 clause texts; ACA's PDF includes the hidden white text on page 23 and the three wrong-record cases of a03 (the PDF says 72 hours, 50% before 30 days after transplanting, 7 days). The Jasindo PDF has 24 pages and contains the drought 21-day condition and the ambiguous deductible wording.
- **FR-15.3** Parcel geometries: polygons around the PLAN centroids sized to the PLAN hectares (±0,05 ha after UTM area calculation), non-overlapping, plus TBN-01…04, GBG-01 and the queue clients' parcels; livestock location for Pak Slamet's shed.
- **FR-15.4** Evidence photos: generate distinct synthetic images per photo (procedural field and water scenes; the landing images may be used only as textures if every pair of hero photos keeps a perceptual-hash distance above `PHASH_MAX_DISTANCE`), with capture metadata (time, coordinates inside the parcel, accuracy) from PLAN 2.8 chips; the generator asserts no unintended near-duplicates. One deliberately reused photo exists only in the red-team fixtures, not in the hero claim.
- **FR-15.5** Story script `scripts/demo/story.py` replays the timeline through service functions (not raw SQL): insurer and staff setup → records compiled from the PDFs (or loaded as compiled outputs when the model is unavailable, flagged) → reviews and publishes on their PLAN dates → client onboarding → assets → risk fixtures → Curation → purchase and payment → alerts → Loss Event → fixture Damage Assessments → claim drafting, confirmation, pre-check → info request and resubmission → decision → payout → nudges and disputes. Each step sets the demo clock to the PLAN timestamp first.
- **FR-15.6** Background volume: a generator creates the queue and platform volumes PLAN shows (Jasindo: 59 claims with tabs All 59 · Open 41 · Due in 48 h 3 · Info requested 5 · Decided 18 and open status split Submitted 4, Pre-checked 14, Under review 18, Info requested 5; platform: 4 insurers, 3.912 clients of which 214 agri SMEs, 5.870 active policies) through the same services in bulk mode, deterministic from a fixed random seed. Totals the generator controls must match PLAN; derived totals (for example the audit event count) are whatever results and screens show them as measured.
- **FR-15.7** Risk calibration: risk-output fixtures for CV Tani Makmur Demak's 6 parcels that reproduce PLAN 2.3 (flood chance per parcel 31, 28, 24, 19, 14, 6%; farm level flood 34%, drought 6%, pest and disease 11%) and make Curation reproduce PLAN 2.6 exactly (expected payouts Rp19.622.400, Rp15.091.200, Rp8.156.160; ratios 1,46, 1,31, 1,18) through the real rules engine and formula. A calibration script solves for class probabilities and fails if any target is missed by more than Rp1.
- **FR-15.8** Checkpoints: the story script can stop after any named step and dump a database snapshot (`pg_dump` custom format) plus the MinIO bucket; `make demo-checkpoint NAME=` restores it. Named checkpoints: `records-published` (5 Jan), `onboarded` (8 Jan), `ranked` (9 Jan), `covered` (10 Jan), `alert-morning` (4 Feb), `claim-drafted` (16 Feb), `info-requested` (19 Feb), `adjuster-morning` (24 Feb 08:30), `paid` (24 Feb 14:32), `finance-day` (26 Feb), `admin-day` (3 Mar 09:15).
- **FR-15.9** Demo accounts (sign-in page, sandbox): CV Tani Makmur Demak (Ibu Sri Wahyuni), Pak Slamet Santoso, Dimas Prasetyo (Jasindo adjuster), Rina Kartika (Superadmin); also signable through the account switcher in `/dev`: Ayu Lestari (Jasindo product manager), Wulan Sari (Jasindo finance), Budi Hartono (ACA product manager).
- **FR-15.10** `make demo-reset` restores the `paid` checkpoint by default (the state most screens show) and verifies the Audit Log chain after restore.
- **FR-15.11** No real personal data: names, phone numbers, NIB and accounts are the synthetic ones in PLAN; phone numbers are sent only to the mock SMS service.

## Gold assertions (run after `make seed`)

| Check | Expected |
| --- | --- |
| Hero parcels total | 48,0 ha (6 parcels) |
| Hero policy | POL-JSD-26-004127, sum insured Rp384.000.000, premium Rp13.440.000, issued 10 Jan 2026, 09:41 WIB |
| Client wallet after premium | Rp11.560.000 |
| Hero claim proposed / final | Rp190.400.000 / Rp187.800.000 |
| Client wallet after payout | Rp199.360.000 |
| Jasindo wallet movements | −Rp187.800.000 at PAY-26-00318 (24 Feb 14:32), −Rp7.200.000 and −Rp20.000.000 on 26 Feb; absolute balances are computed from the ledger (decision R-001), not taken from PLAN 2.10 |
| Pak Slamet AUTP | sum insured Rp7.200.000, premium Rp216.000, client paid Rp43.200 |
| Pak Slamet AUTS/K | sum insured Rp120.000.000, premium Rp2.400.000, client paid Rp480.000 |
| CLM-26-000431 / CLM-26-000436 | Rp20.000.000 / Rp7.200.000, paid 26 Feb 2026 09:41 / 09:12 |
| Notice and settlement | CLM-26-000418 notice due 21 Feb 2026, decision due 6 Mar 2026; CLM-26-000402 window ended 28 Feb 2026, over by 3 days on 3 Mar |
| Jasindo payouts since 1 Feb | Rp412.600.000 across 21 payouts |
| Curation order | Jasindo 1,46 > Askrindo 1,31 > Sinar Mas 1,18; AUTP not eligible |
| Audit chain | verifies with 0 breaks |

## Out of scope

Real client or insurer data of any kind; real satellite outputs for the synthetic event (D-05).
