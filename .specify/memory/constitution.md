# AiGRI Constitution

Version 1.0.0 · Ratified 2026-10-20 · Applies to every spec, plan, task and line of code in this repository.

This file holds the rules that no feature may break. A spec, plan or task that conflicts with it is wrong and must be changed, not the constitution. Amendments need a written reason in `specs/00-shared/decisions.md` and a version bump here.

Sources it is distilled from: `docs/source/technical-brief-v2.md` (the brief), `docs/source/settled-decisions-2026-10-20.md`, `DESIGN.md` and `system-preview/PLAN.md`.

---

## Article I. People decide, code moves money, the agent prepares

1. The AI agent never decides a Claim, never sets a final amount, never binds cover, never publishes a Policy Record and never moves money. These are Tier 3 actions and the agent has no tool for them.
2. An Adjuster decides a Claim and its final amount. A Product Manager publishes a Policy Record. A Client confirms a purchase or a Claim Packet. A Finance user funds an Insurer Wallet.
3. Money moves only when code reacts to a recorded human action: the Client's hash-matched purchase confirmation, the Adjuster's approval event, the Underwriter's decline event. Never on an agent call.
4. The Superadmin can onboard insurers, audit and nudge. The Superadmin cannot approve claims, edit Policy Records, edit rankings or move money.

## Article II. The LLM extracts and explains; code decides

1. Coverage, deadlines, loss category, Proposed Amount, expected payout and ranking are computed by deterministic code (`rules/`, `curation/`). An LLM output is never an input to a money or coverage decision except as a typed field a person has reviewed.
2. Every policy answer cites a clause span from a published Policy Record, or abstains with "Not stated in this policy."
3. Retrieve clause spans, not whole documents.

## Article III. Untrusted content never steers the agent (CaMeL pattern)

1. Untrusted content: insurer-uploaded policy PDFs, client letters, vet certificates, photos, hazard advisory text, any web page.
2. Only the quarantined reader touches untrusted content. It has no tools and returns only JSON that validates against a schema. Anything that fails validation is dropped, not repaired by free text.
3. The planner never sees raw untrusted text. It sees typed fields carrying capability tags.
4. Every value carries an origin tag. The gateway refuses a tool call whose arguments use a value whose tag is not allowed for that argument (for example, a value from a PDF can never set a ranking weight, a tool target, an amount or a recipient).

## Article IV. One gateway in front of every tool

1. Every tool call, from the agent or from a person through the API, passes `gateway/`, which checks role, tenant and tier before the tool runs, and writes an Audit Log entry.
2. Tier 0 acts alone (logged). Tier 1 produces drafts only. Tier 2 needs the Client's confirmation of the exact payload and a matching SHA-256 hash. Tier 3 tools are not registered for the agent at all.
3. Consent is bound to the exact payload: canonical JSON (RFC 8785), SHA-256. Any change after confirmation invalidates it.

## Article V. Evidence is sacred

1. The agent never creates or edits evidence. Photos are write-once.
2. Evidence photos come only through the Capture Page, which records GPS, accuracy, device time and a SHA-256 of the bytes at capture. The server recomputes the hash and stamps its own receipt time.
3. Damage Assessment is evidence for the Adjuster, never a decision.
4. Never auto-deny. Low confidence, a failed check, a missing source or "not detected" lowers confidence and asks for more evidence. It never closes a Claim. Only an Adjuster can deny.

## Article VI. Everything is logged, and the log cannot lie

1. The Audit Log is append-only and hash-chained: each entry stores the SHA-256 of the previous entry. The database role used by the app cannot UPDATE or DELETE it.
2. Every agent call, every tool call, every money movement, every role change and every decision writes an entry.
3. The Audit Log and the operation logs are the execution evidence for the competition. Bench runs export both.

## Article VII. Tenants are walls

1. Every insurer-owned row carries `insurer_id`. PostgreSQL row-level security filters on the session's insurer. A route bug must not be able to leak another insurer's data.
2. An Insurer sees a Client's data only after that Client buys from that Insurer, and only the Insurable Assets that Policy covers.
3. Curation runs on AiGRI's side. No Insurer learns who was shown its product.

## Article VIII. Ranking is fair and replayable

1. Curation ranks published Products by one formula, the same for every Client: expected payout ÷ premium under predicted risk, after a coverage-fit filter. Ties break by fit, then lower premium, then product id.
2. There is no sponsorship, boost or placement input. A Policy Record field can never change a ranking weight.
3. Every Curation run records formula version, Risk Model version, input snapshot hash and output, and can be replayed to the identical result.

## Article IX. Country packs, not hard-coding

1. Currency, number and date formats, area unit, time zone, regulator, payout rails, hazard sources, public schemes, insurer roster and data law come from the active country pack.
2. Components and services never hard-code "Rp", "PHP", "ha", "WIB", "OJK", "BI-FAST" or any insurer name.
3. Indonesia is the live pack. The Philippines, Vietnam and Thailand are planned. Never invent insurers for planned packs.
4. Premiums and payouts settle in the Policy Record's currency. A display currency is converted for display only and labelled "approx.".

## Article X. Honest data

1. All demo data is synthetic. No real personal data anywhere in the repo.
2. Insurer names are real (Asuransi Jasindo, Askrindo, Asuransi Sinar Mas, Asuransi Central Asia). Products, prices and claims are synthetic, and every policy screen says "Demo data. Products and prices are illustrative." No insurer logos.
3. Reports and the bench show only measured numbers. A suite that did not run shows "not run".
4. Copy never says "AiGRI approved", "auto-approved" or "AI decided".

## Article XI. The design system is law for the UI

1. `DESIGN.md` governs look, motion, accessibility and voice. Its token and class names are used exactly.
2. One yellow (`.btn-y`) per view, on the commitment. No hairline borders, dashed outlines, inset rings, blur or decorative gradients. No `vh`/`vw` units. Body text 17px minimum, secondary 15px.
3. WCAG 2.2 AA. Reduced motion respected. Status is never colour alone.
4. The prototype in `system-preview/` is the visual reference for every screen it covers. A screen without a prototype is composed only from existing DESIGN.md components.

## Article XII. Spec first, test first

1. No code without a task in a `tasks.md` that traces to a requirement in a `spec.md`.
2. Rules engine, curation, wallet ledger, gateway and hashing code are written test first. Their tests use the gold figures in `specs/15-seed-demo/spec.md`.
3. A task is done when its acceptance checks pass in CI, it writes the Audit Log entries its spec requires, and the docs it touches are updated.
4. If a spec is ambiguous, stop and record the question in `specs/00-shared/decisions.md` under "Raised by agents". Use the stated default if one exists; otherwise do not guess.

## Glossary

The glossary in `docs/source/technical-brief-v2.md` (section "Glossary") is binding. Use its words with exactly its meanings, in code identifiers too: Client, Insurer, Superadmin, Insurable Asset, Parcel, Ear Tag, Product, Policy Record, Issuance Limits, Policy, Risk Model, Curation, Loss Event, Damage Assessment, Claim, Claim Packet, Proposed Amount, Adjuster, Wallet, Payout, Nudge, Capture Page, Audit Log.
