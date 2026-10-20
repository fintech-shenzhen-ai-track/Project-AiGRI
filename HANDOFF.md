# Handing AiGRI v2 to coding agents

This repository is ready for spec-driven development. Nothing is built yet: the specs say what to build, in what order, and how each piece is checked. Every coding agent reads `AGENTS.md` first (Claude Code reads it through `CLAUDE.md`).

## What is in here

| Path | What it is | Who edits it |
| --- | --- | --- |
| `.specify/memory/constitution.md` | The 12 rules no code may break (people decide, code moves money, CaMeL, gateway, evidence, audit chain, tenants, fair ranking, country packs, honest data, design law, spec first) | Team only, with a decision entry |
| `AGENTS.md`, `CLAUDE.md` | How agents work here: reading order, layout, commands, CI rules, definition of done | Team |
| `specs/00-shared/` | Roadmap and waves, decisions (38 settled + 1 raised), data model, lifecycles and events, hashing and Audit Log, API conventions, path ownership, the tool and tier registry, 7 JSON schemas | Team; agents add to "Raised by agents" |
| `handoff/` | `DEV-A.md`, `DEV-B.md`, `TEAMMATES.md`, `contracts-board.md`: who does what, in what order, and the cross-lane contracts | The developers |
| `specs/01-…/` to `specs/18-…/` | One folder per feature: `spec.md` (what and why), `plan.md` (how), `tasks.md` (ordered tasks with "Done when") | The agent assigned to that feature ticks tasks |
| `packs/` | Country packs: Indonesia (live), Philippines, Vietnam, Thailand (planned), validated against the schema | Feature 01 |
| `docs/source/` | Your technical brief v2 and the settled-decisions notes, kept read-only | Nobody |
| `DESIGN.md`, `design-system/`, `system-preview/`, `wireframe/`, `brand/`, `landing-preview/` | Your design system, prototype and wireframes, unchanged | Nobody (reference) |

The layout matches GitHub Spec Kit's convention (`.specify/memory/constitution.md`, `specs/<feature>/spec.md`, `plan.md`, `tasks.md`), so you can also drive it with Spec Kit's commands if you use them.

## Two developers, two lanes

Each developer owns whole features, backend and UI together, so nobody hands a half-built feature to the other. Start with your lane's document; it has your features in order, a kickoff prompt per feature, what you owe the other developer, and a review checklist for their pull requests.

| Lane | Owner | Features | Tasks | Start here |
| --- | --- | --- | --- | --- |
| A, Platform, trust and money | Developer A | 01 Foundation, 05 Rules engine, 02 Gateway and agent, 12 Wallet, 04 Policy Compiler, 10 Damage Assessment, 08 Purchase, 15 Seed and demo, 16 Bench | 128 | `handoff/DEV-A.md` |
| B, Journeys and portals | Developer B | 03 UI shell, 06 Client assets, 07 Risk and Curation, 09 Hazards and alerts, 11 Claims, 13 Insurer views, 14 Superadmin, 17 Landing, 18 Deliverables | 117 (more screens) | `handoff/DEV-B.md` |
| Data and gold answers | Accounting and PolSci teammates | Feature 15 fixtures and the bench gold cases | about 12 | `handoff/TEAMMATES.md` |

The lanes depend on each other through 26 contracts (tables, API stubs and interfaces each feature merges first). Both developers tick them in `handoff/contracts-board.md`, and a short daily sync checks the longest chain: 01 → 02 → 06 → 07 → 08 → 11.

| Wave | Developer A | Developer B |
| --- | --- | --- |
| 0 | 01 Foundation, then 05 Rules engine | 03 UI shell (components early) |
| 1 | 02 Gateway, 12 Wallet | 06 Client assets |
| 2 | 04 Policy Compiler, 10 Damage Assessment | 07 Risk and Curation, 09 Hazards and alerts |
| 3 | 08 Purchase | 11 Claims |
| 4 | 15 story script, 16 Bench | 13, 14, 17, 18 |

Each developer can run up to two coding agents at once inside their lane. Each reviews the other's pull requests: A checks gateway, tier, tenant and money rules; B checks DESIGN.md and the prototype. Branch per feature (`feat/NN-name`).

## Decisions the team should confirm

Most open questions from your brief have a working default in `specs/00-shared/decisions.md`, so agents can start now. These need a person:

1. **R-001, insurer wallet figures.** PLAN 2.10's Jasindo balances cannot all hold under double-entry accounting: Rp5.000.000.000 funding minus the February payouts before 24 Feb (Rp197.600.000) is Rp4.802.400.000, not Rp4.100.440.000, even before premiums. Default: the ledger computes the balances and the screens show those. Confirm or pick another option in the decision row.
2. **D-02, demo data.** The Indonesia demo (Demak, Pak Slamet, 4 real insurer names, 8 products) replaces the brief's older Cotabato demo list. The hog and poultry side thread is dropped from the demo (code still supports it, D-15).
3. **D-05, hero satellite evidence.** The Feb 2026 flood is synthetic, so its readings are labelled fixtures; the real pipeline is validated on the real Demak floods of 8 Feb 2024 and 16–17 Mar 2024.
4. **D-10, vision model.** `qwen3:14b` cannot read images, so Ear Tag photos use `qwen3-vl:8b` (needs Ollama 0.12.7+).
5. **D-27, BMKG access.** Not yet verified; task T-09.03 checks it first.
6. **Insurer consent.** The brief notes you need each insurer's consent before showing its name in public material; the specs keep real names with "Demo data" notes, so confirm before any public demo.
7. **Placeholder source.** The PCIC denied-claims study stays labelled "placeholder" in the deliverables until you add its link.

## Changes made to your files in this package

- Moved `AiGRI — Technical Brief for Developer (v2).md` to `docs/source/technical-brief-v2.md` and `docs/aigri-v2-spec.md` to `docs/source/settled-decisions-2026-10-20.md`.
- Removed `__MACOSX/`, `.DS_Store` files and the duplicate `design-system.zip`.
- Everything else is as you sent it.
