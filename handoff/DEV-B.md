# Developer B handoff: Journeys and portals

You own what users see and click: the PWA shell and design system, Client onboarding and assets, risk and Curation, hazards and alerts, claims, the insurer dashboard and portfolio, the Superadmin portal, the landing page and the submission documents. This carries most of task completion (40%) and innovation (30%). Developer A owns the platform, the gateway, money, the Policy Compiler and Damage Assessment; you build on A's contracts. A builds a few screens (i02, c08, c13, i06, underwriting) with your components, so ship components early.

## 1. Your features

Work top to bottom. "Contract" is the first merge A is waiting for; ship it before the rest of the feature.

| Order | Feature | Wave | Tasks | Screens (prototype in `system-preview/`) | Contract A waits for | You wait for (from A) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 03 UI shell and design system | 0 | 21 | c01 sign-in, all portal shells, kitchen sink, `/client/settings` | C04, then C05 | C02, C03 |
| 2 | 06 Client onboarding and assets | 1 | 14 | c02, c03, c04, Capture Page, register an animal | C09, C10 | C07, C08, C11 (herd count) |
| 3 | 07 Risk Model and Curation | 2 | 17 | c05, c06, c07 | C20 | C13, C14, C15, C16 |
| 4 | 09 Hazards, Loss Events and alerts | 2 | 14 | c09, c10, alerts list | C18 | C11 (BMKG parsing) |
| 5 | 11 Claims | 3 | 19 | c11, c12, i03, i04, appeal draft | C22 | C12, C16, C19, C21 |
| 6 | 13 Insurer dashboard and portfolio | 4 | 6 | i01, i05 | none | C23 (your own 14) |
| 7 | 14 Superadmin and Nudges | 4 | 16 | a01–a06, staff roles sheet | C23 | C12, C13 |
| 8 | 17 Landing page | 4 | 3 | `/` from `landing-preview/` | none | none |
| 9 | 18 Submission deliverables | 4 | 7 | none (documents) | none | C26 (registry export), A's bench sample |

Total: 117 tasks, with more screens than A's lane.

## 2. Day one

1. Clone the repository A created.
2. Read, in order: `AGENTS.md`, `.specify/memory/constitution.md`, `specs/00-shared/` (all files), `DESIGN.md`, then `specs/03-ui-shell/`.
3. Open `system-preview/shared/_kitchen-sink.html` and three prototype pages in a browser; that is the bar.
4. Join A's 30-minute first call: lanes, daily sync time, contract board rule.
5. Start one coding agent on 03. Until A's auth contract (C03) merges, build the CSS port, icons and components against static data.

## 3. Run sheet per feature

Every kickoff prompt starts with the same base. Paste the base, then the feature lines.

**Base prompt:**

> You are implementing feature `{NN-name}` of AiGRI, in Developer B's lane (Journeys and portals). Read, in order: `AGENTS.md`, `.specify/memory/constitution.md`, `specs/00-shared/roadmap.md`, `specs/00-shared/decisions.md`, `specs/00-shared/ownership.md`, `handoff/contracts-board.md`, then `specs/{NN-name}/spec.md`, `plan.md` and `tasks.md`, and every `specs/00-shared/` file the plan links to. For every screen, read `DESIGN.md` and open the matching page in `system-preview/` in a browser; it is the visual reference. Work through `tasks.md` in order; merge Phase A (the contract) first and tick its row on the contract board in the same pull request. Write only inside the paths your feature owns. Every backend route uses `gate("<tool>")` with a tool from `specs/00-shared/tools-and-tiers.md`. Money, coverage, deadlines and rankings come from the rules engine and Curation, never from UI code. Tick each task in the commit that completes it. If something is unclear, check `decisions.md`; if it has no answer, add a row under "Raised by agents" and continue with tasks that don't depend on it. Do not invent scope, insurer names, regulations or numbers.

### 03 UI shell and design system

Add to the base:
> Port `system-preview/shared/system.css` as the global stylesheet with the same class names; no Tailwind or UI kit. Ship components in the order Developer A needs them for i02, c08, c13 and i06 (contract C05): buttons, fields, cards, tables, pills, sheets, modals, stepper, then the rest. Formatters must pass the shared `format-cases.json` from feature 01. Add the design lint and the one-yellow-per-view check to `make lint` and `make e2e`. Support `?still` mode for screenshots.

Done means: the kitchen-sink route matches the prototype; demo sign-in reaches each portal shell at 1280 px (and 390 px for the Client); axe reports no serious issues.

### 06 Client onboarding and assets

Add:
> Parcel area is computed in the local UTM zone (EPSG:32749 for Demak). The Capture Page hashes the exact bytes it uploads; never re-encode an image in the browser. Photos queue offline in IndexedDB through the service worker. A duplicate Ear Tag is refused without revealing the other owner. Location and time checks flag a photo; they never reject it.

Done means: c02, c03 and c04 match the prototype; an e2e test with mocked GPS and an offline toggle uploads one photo with a matching hash.

### 07 Risk Model and Curation

Add:
> Rankings are deterministic: `Decimal`, fixed quantisation, canonical input ordering; a replay must give byte-identical output. Farm-level flood chance comes from the joint scenario set, not from multiplying parcel probabilities. Reason wording for the demo products follows PLAN c06 exactly. There is no sponsorship or placement input anywhere; a test checks that. Use Developer A's `PolicyQA` and clause sheet components in c06 and c07 (contract C15).

Done means: c06 shows Jasindo 1,46, Askrindo 1,31, Sinar Mas 1,18 and AUTP not eligible from seeded data; a replay matches the stored run.

### 09 Hazards, Loss Events and alerts

Add:
> Do task T-09.03 first: confirm how BMKG warnings can be accessed and record the finding in `decisions.md` (D-27). Advisory text goes only through the quarantined reader. One alert per Client per Loss Event, updated rather than re-sent. Home (c09) has no yellow button; the action lives on the alert page. Never hard-code the warning authority's name; read it from the pack and the alert.

Done means: on the `alert-morning` checkpoint, c09 and c10 match the prototype; the backtest harness reports alerts for the Demak 2024 events.

### 11 Claims

Add:
> Never auto-deny: only `claim.decide` by a person moves a claim to denied; write that test first (T-11.03). Decisions are bound to the current packet hash. Amount previews are computed server side by the rules engine on every edit; the UI only displays them. The settlement timer pauses while information is requested. Start from Developer A's fixture Damage Assessments (contract C19). In the sandbox, claim pages with fixture evidence show the demo note (D-05).

Done means: the e2e test confirms the hero packet on c11, then on i04 changes DMK-05 to 15%, approves Rp187.800.000, and sees the payout card; the cattle retake loop works end to end.

### 13 Insurer dashboard and portfolio

Add:
> Views use `security_invoker` so RLS applies; no number may include another insurer's data, not even an aggregate. KPI tiles never count up. The wallet balance comes from the ledger (R-001).

Done means: i01 and i05 match the prototype on the `adjuster-morning` checkpoint; the tenant-leak test passes.

### 14 Superadmin and Nudges

Add:
> The Superadmin cannot approve claims, edit records or rankings, or move money; say so on screens where an action could look like that. Rule Nudges fire once per subject per condition, daily at 09:00 in the pack's time zone. The ranking audit replays Curation runs through feature 07's replay. "Verify chain" calls the Audit Log verifier from feature 01.

Done means: a01–a06 match the prototype on the `admin-day` checkpoint; Superadmin overreach red-team cases are refused.

### 17 Landing page

Add:
> Port `landing-preview/index.html`; its fluid `vw` headings are allowed on this marketing route only. Apply PLAN section 10's copy changes. Keep the protection-gap figure as a bracketed placeholder; never invent a number.

### 18 Submission deliverables

Add:
> Every number comes from a bench run (cite the run id) or is labelled demo data. The security self-assessment's permission table is generated from Developer A's registry export (contract C26). The PCIC denied-claims study stays labelled "placeholder" until the team supplies its link.

## 4. What you owe A, in priority order

C04 → C05 → C09 → C10 → C18 → C20 → C22 → C23. Full list in `handoff/contracts-board.md`.

## 5. Shared things you are the single owner of

- **Components and styles.** `portals/components/`, `portals/styles/`, icons, logos. A requests changes through you.
- **Navigation config** `portals/lib/nav.ts`. Every route already has an entry, so features never edit it.
- **The design lint and one-yellow check.**
- **Visual regression report** against the prototype shots.

## 6. Reviewing A's pull requests

Check every A pull request that touches the UI against this list before approving:

- [ ] Matches the `system-preview/` page at 1280 px (and 390 px for Client pages) in still mode.
- [ ] One yellow button per view; no borders, dashed lines, blur, `vh`/`vw` or decorative gradients.
- [ ] Body text at least 17 px, secondary at least 15 px; inputs 17 px.
- [ ] Money, units, dates, time zone and regulator names come from the pack formatters; no literal "Rp", "ha", "WIB".
- [ ] Every coverage statement has a clause chip or says "Not stated in this policy".
- [ ] Copy says who acts (the Client confirms, the Adjuster decides, the wallet receives); never "AiGRI approved".
- [ ] Keyboard access, focus return from sheets and modals, reduced motion, axe clean.
- [ ] A demo note on every screen that shows policies or fixture evidence.

## 7. Milestones for your lane

| Milestone | Your exit criteria |
| --- | --- |
| M1 Walking skeleton | C04, C05 merged; demo sign-in reaches all three shells |
| M2 Buy path | 06 and 07 done; hero steps 2 and 3 work in the browser |
| M3 Claim path | 09 and 11 done; hero steps 5–8 and the cattle side thread work |
| M4 Oversight | 13 and 14 done; hero step 10 works |
| M5 Submission | Landing live; documents in `docs/` with bench-sourced numbers; demo video recorded from the checkpoints |
