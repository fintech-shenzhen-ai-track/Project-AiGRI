# 17 Landing page: spec

## Summary

Port the approved landing page (`landing-preview/index.html`, the visual source of truth per DESIGN.md) to the PWA's public root route, and apply the Indonesia follow-ups listed in `system-preview/PLAN.md` section 10.

## Requirements

- **FR-17.1** `/` renders the landing page with the same markup, tokens and motion as `landing-preview/index.html` (the landing keeps its own fluid heading sizes; the app's no-`vw` rule does not apply to this marketing route, as DESIGN.md 3 states).
- **FR-17.2** Apply PLAN section 10 changes: neutral or Indonesian image alt texts; "Cattle, goats and poultry."; "One farm, one flood."; FAQ "Where does it work?" naming Indonesia first, then the Philippines, Vietnam and Thailand; keep insurer logo placeholders; update photo credits to match the photos kept.
- **FR-17.3** The protection-gap figure stays a bracketed placeholder until an Indonesian figure with a citable source is provided by the team; never invent a number.
- **FR-17.4** "Get covered" and sign-in links go to `/sign-in`; the page works without JavaScript.
- **FR-17.5** Lighthouse accessibility ≥ 95 and no layout shift from images (explicit sizes).

## Tasks

- [ ] **T-17.01** Port the page and assets into `portals/app/(marketing)/`. FR-17.1, FR-17.4.
- [ ] **T-17.02** Apply the PLAN section 10 copy and alt changes; list any line still waiting on a source in `decisions.md` "Raised by agents". FR-17.2, FR-17.3.
- [ ] **T-17.03** Accessibility and performance checks. FR-17.5.
