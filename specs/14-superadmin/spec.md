# 14 Superadmin and Nudges: spec

## Summary

AiGRI's platform operator watches health, onboards and verifies insurers, audits policy quality and the ranking formula, tracks settlement windows and disputes, sends Nudges, compares country packs and verifies the Audit Log. The Superadmin oversees and nudges; it cannot approve claims, edit Policy Records or rankings, or move money, and the screens say so wherever an action could be mistaken for that.

## User stories

**US-14.1 Overview (a01).** As Rina Kartika on 3 Mar 2026, 09:15 WIB, I see insurers (3 live, ACA in verification), clients 3.912 (214 agri SMEs, 3.698 farmers), active policies 5.870, over SLA 1 (Sinar Mas), the flood-claims funnel (Submitted 96 → Decided 71 → Paid 64 → Over SLA 1), median time to decision 6,2 days, paid Rp2,41 M, SLA by insurer, system health with SMS sandbox degraded, this week's Nudges, and the last ranking audit.

**US-14.2 Onboard an insurer (a02).** As the Superadmin, I take ACA through verification: licence documents, data processing agreement (UU PDP), tenant created and isolated, roles assigned, funding account verified, wallet pre-funded to Rp500.000.000, first record reviewed; "Mark ACA as live" stays disabled until all are done; I can send an AiGRI-drafted reminder.

**US-14.3 Policy quality (a03).** As the Superadmin, I see the ranking rule, the last audit (500 rankings recomputed, 500 match, no paid-placement fields, 0 anomalies), every record's confidence and self-check, and for ACA's record the injected-instruction alert and its three self-check disagreements; I can hold a record from ranking and nudge the insurer.

**US-14.4 SLAs, Nudges and disputes (a04).** As the Superadmin, I see CLM-26-000402 three days over Sinar Mas's 14-day window, the rule Nudge sent 1 Mar and seen without action, and an AiGRI-drafted second Nudge that I edit and send; I see SLA by insurer, the Nudge rules (underwriting age "Not set yet"), the disputes and the Nudge log.

**US-14.5 Country packs (a05).** As the Superadmin, I compare packs: Indonesia live with all values and a live format preview; Philippines, Vietnam and Thailand planned with their setup steps.

**US-14.6 Audit log (a06).** As the Superadmin or a judge, I filter the hash-chained log, open any event to see actor, tier, previous and own hash and payload, and press "Verify chain" to recompute it.

## Functional requirements

- **FR-14.1** Overview aggregates across tenants through audited admin views (reads of client personal data are not needed here and not exposed): insurer counts by status, client counts by kind, active policies, event funnel per Loss Event, median time to decision, paid totals, SLA by insurer (median days ÷ window, open, over), system health, Nudges this week, latest ranking audit.
- **FR-14.2** System health: components (Sentinel-1 ingest, Sentinel-2 ingest, official warnings, Open-Meteo, GDACS, wallet ledger integrity, audit chain, push, SMS, email) with status and last success time, written by the worker into `system_health`; degraded states show a plain explanation of impact.
- **FR-14.3** Insurers: list with status, since, products live, open claims, median decision, wallet status; create an insurer from the pack roster only (never a free-text name, D-02); verification steps with who and when; send reminders; go live only when every step is done (`insurer.go_live`, Tier 3). Roles assigned per D-20 (`membership.grant/revoke`), each logged.
- **FR-14.4** Tenant isolation test card: shows the last automated cross-tenant test result (feature 01's RLS test run nightly against production-like data) and "no shared roles across tenants".
- **FR-14.5** Policy quality: ranking rule text and version, last audit, run-audit-now (`ranking.audit`: recompute a random sample of recent Curation runs with `curation.replay` and compare hashes; count records with any field outside the schema; flag rank changes without input changes as anomalies via `anomaly.flag`); records table with confidence, self-check and age; record detail with injection findings and disagreements; hold from ranking (`policy_record.hold`); nudge.
- **FR-14.6** Nudge rules (D-21, D-29), each a daily job at 09:00 pack time: claim past settlement window; claim due in 48 h; Policy Record unreviewed ≥ 7 days; underwriting item older than a threshold (disabled until set). Rule Nudges send automatically (`nudge.send` by code), appear on the insurer dashboard, and are logged; a rule fires once per subject per condition (no daily repeats) unless the Superadmin re-sends.
- **FR-14.7** Free-text Nudges: the agent drafts (`nudge.draft`, Tier 1) from typed facts (claim, window, dates, clause); the Superadmin edits and sends (`nudge.send`, Tier 3); delivered to the insurer's claims team in-app and by email (mock).
- **FR-14.8** Disputes: opened by a Client from a claim (`dispute.open`), listed with client ↔ insurer, claim, issue, opened, status; detail shows the appeal text and the insurer's response due date; the Superadmin can remind the insurer and record a resolution (`dispute.resolve`) but cannot change a claim decision.
- **FR-14.9** Country packs: cards per pack with status and setup progress (from the pack files), detail `.kv` per pack, a live format preview generated by the formatters for the live pack; changing a live pack's currency or rails requires two Superadmins and is logged (v2: the screen states the rule; editing packs happens in files and deploys).
- **FR-14.10** Audit log viewer: filter by actor type, time range and search (claim, policy, person); table with seq, time (mono), actor, action (mono), object, short hash; event sheet with tier, previous hash, hash and the payload (pretty, mono); chain status card; "Verify chain" (`audit.verify_chain`) with loading state and result toast; nightly verification job.
- **FR-14.11** Every Superadmin screen with an action that could look like a decision shows the line "You can't approve claims or move money from here." where relevant (a04 lead, insurer detail, disputes).

## Screens

a01–a06 (`system-preview/admin/01-overview.html` … `06-audit-log.html`); insurer staff role management (no prototype, D-14: a table and a sheet in the a02 style).

## Audit entries

`insurer.created`, `insurer.verification_step_done`, `insurer.went_live`, `membership.granted`, `membership.revoked`, `nudge.drafted`, `nudge.sent`, `dispute.opened`, `dispute.resolved`, `policy_record.held`, `ranking.audited`, `audit.chain_verified`.

## Bench cases contributed

Ranking audit determinism (replay sample = 100% match); red team: Superadmin attempts to call `claim.decide`, `wallet.post_payout` or edit a ranking through the API (all refused).
