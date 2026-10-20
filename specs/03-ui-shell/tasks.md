# 03 UI shell and design system: tasks

## Phase A: contracts

- [x] **T-03.01** Next.js app scaffold with pnpm, TypeScript strict, ESLint, Vitest, Playwright + axe; `make lint` and `make e2e` wired. Done when: a placeholder page passes lint, unit and e2e.
- [x] **T-03.02** Port `system.css` to `styles/system.css` and the icon sprite and logos. FR-03.1. Done when: a static page using prototype markup looks identical to the prototype file side by side.
- [ ] **T-03.03** `lib/nav.ts` with every route in the plan's route table and role guards in `middleware.ts`. FR-03.6, FR-03.7.
- [ ] **T-03.04** `lib/api` generated types and client (uses `openapi.json` from 01). FR-03.5.
- [ ] **T-03.05** `lib/pack` provider and formatters, run against `specs/01-foundation/format-cases.json`. FR-03.4.

## Phase B: components

- [ ] **T-03.06** [P] Buttons, fields, inputs, selects, choices, checks, switch, seg, chips, upload, OTP.
- [ ] **T-03.07** [P] Cards, stat, kv, meter, policy card, cite, demo note, sandbox pill, ins-mark, avatar, hash.
- [ ] **T-03.08** [P] Table (with stack mode, flagged rows, clickable rows), pills, tabs with ink bar, banners, empty, skeleton, error state, check list.
- [ ] **T-03.09** [P] Modal, sheet (bottom on mobile, right panel on desktop), toasts, disclosure, flow + stepper, timeline.
- [ ] **T-03.10** [P] Charts (bars, line+area, stacked bar, sparkline, threshold line, "Show as table").
- [ ] **T-03.11** [P] Map component with `schematic` and `maplibre` renderers, legend, map label, controls; Terra Draw polygon drawing in the `maplibre` renderer. D-13.
- [ ] **T-03.12** [P] Satellite compare, photo grid and photo chip, consent block, count-up, sun-rise mark.
- [ ] **T-03.13** Motion utilities: reveal, still mode, reduced motion. FR-03.3.
- [ ] **T-03.14** Kitchen-sink route reproducing `_kitchen-sink.html`. US-03.1.

## Phase C: shells and sign-in

- [ ] **T-03.15** AppShell for client (desktop + mobile bars), insurer and admin (with min-width notice), country chip, user block, topbar with story clock. FR-03.8, FR-03.11, US-03.2.
- [ ] **T-03.16** Sign-in page c01: hero, form, OTP step, demo accounts in sandbox, membership chooser. US-03.3.
- [ ] **T-03.17** Client settings page (profile sheet content, notification channels, country indicator). D-14.
- [ ] **T-03.18** PWA manifest, icons, service worker for push and an upload queue API used by feature 06; push subscription endpoint wiring. FR-03.9, US-03.4.
- [ ] **T-03.19** `/dev` area: kitchen sink, inbox, clock. FR-03.12.

## Phase D: quality

- [ ] **T-03.20** Design lint script and one-yellow-per-view Playwright check. FR-03.10.
- [ ] **T-03.21** Visual regression report against prototype shots; axe checks on shells. Non-functional.
