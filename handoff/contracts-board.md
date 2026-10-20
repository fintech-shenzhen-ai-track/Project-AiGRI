# Contract board

The two developer lanes depend on each other through "contracts": the first phase of a feature's `tasks.md` (tables, API stubs, schemas, interfaces) or one named task. Merge contracts early and tick them here in the same pull request. When a contract you are waiting for is not ticked, work on tasks that don't need it, or build against a fake that follows the spec, and swap it in later.

Lanes: **A** = Platform, trust and money. **B** = Journeys and portals. **T** = accounting and PolSci teammates (reviewed by A).

| # | Contract (task) | From | To | Unblocks | Wave | Merged |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | Repo, Docker Compose, migration 0001, API shell (T-01.01–T-01.04) | A | B | Every feature | 0 | [ ] |
| C02 | `format-cases.json` (T-01.10) | A | B | Pack formatters in the UI (T-03.05) | 0 | [ ] |
| C03 | Auth endpoints and session cookie (T-01.15), OpenAPI exported | A | B | Typed API client (T-03.04), sign-in c01 (T-03.16) | 0 | [ ] |
| C04 | `system.css` port and icon sprite (T-03.02) | B | A | Any screen A builds | 0 | [x] |
| C05 | Core components (T-03.06–T-03.12) and `lib/api` (T-03.04) | B | A | i02 (T-04.14), c08 (T-08.11), c13 and i06 (T-12.10, T-12.11), underwriting (T-08.12) | 0–1 | [x] |
| C06 | Rules engine model and gold tests (T-05.01, T-05.02) | A | B | Curation and claims test setup | 0 | [ ] |
| C07 | Tool registry, tags and `gate()` (T-02.01–T-02.03) | A | B | Every backend route B writes (06, 07, 09, 11, 13, 14) | 1 | [ ] |
| C08 | Wallet adapter and wallet-creation interface (T-12.02, T-12.03) | A | B | Onboarding finish (T-06.03) | 1 | [ ] |
| C09 | Assets tables and endpoints (T-06.01, T-06.02) | B | A | Damage Assessment (10), Purchase (08) | 1 | [ ] |
| C10 | Capture uploads with hashes and pHash (T-06.06) | B | A | Photo checks (T-10.12) | 1 | [ ] |
| C11 | Quarantined reader (T-02.10) | A | B | BMKG page parsing (T-09.03), herd-count reading (T-06.07) | 1 | [ ] |
| C12 | Drafting runtime (T-02.12) | A | B | Info-request and appeal drafts (T-11.08, T-11.15), Nudge drafts (T-14.03) | 1 | [ ] |
| C13 | Policy Record tables and endpoints (T-04.02, T-04.03) | A | B | Curation candidates (T-07.09) | 2 | [ ] |
| C14 | Publish service (T-04.12) | A | B | Real published records in Curation | 2 | [ ] |
| C15 | Clause sheet and `PolicyQA` component (T-04.15) | A | B | c06 and c07 (T-07.14, T-07.15) | 2 | [ ] |
| C16 | `proposed_amount`, `expected_payout`, `fit` (T-05.07, T-05.09) | A | B | Curation score (T-07.10), pre-check (T-11.07) | 1–2 | [ ] |
| C17 | `forecast_snapshots` table (T-07.01) | B | B | Alerts (09) | 2 | [ ] |
| C18 | Loss Events (T-09.05) | B | A | Damage Assessment pipeline (10) | 2 | [ ] |
| C19 | Fixture Damage Assessments (T-10.02) | A | B | Claim drafting (T-11.04) | 2 | [ ] |
| C20 | Curation runs (T-07.12) | B | A | Quotes (T-08.03) | 2 | [ ] |
| C21 | Policies and `policy_assets` (T-08.01) | A | B | Claims tables (T-11.01), insurer views (13) | 3 | [ ] |
| C22 | Claim state machine and `claim.approved` event (T-11.03, T-11.08) | B | A | Real payouts end to end (T-12.06 is built earlier against fake events) | 3 | [ ] |
| C23 | Nudges table (T-14.01) | B | B | Dashboard nudges (13) | 4 | [ ] |
| C24 | Bench runner (T-16.01) | A | B | B's bench cases run in CI | 0–1 | [x] |
| C25 | Fixture files (T-15.01–T-15.05) | T (A reviews) | A, B | Every gold test | 0–1 | [ ] |
| C26 | Gateway registry export for the self-assessment (part of T-18.03) | A | B | Security self-assessment document (18) | 4 | [ ] |

## Longest chain

01 → 02 → 06 → 07 → 08 → 11 crosses lanes four times (C07, C09, C20, C21). Check this row of contracts at the daily sync until 11 starts.
