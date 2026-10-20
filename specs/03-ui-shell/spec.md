# 03 UI shell and design system: spec

## Summary

One Next.js PWA serves the Client, Insurer and Superadmin portals. This feature ports the approved design system (`DESIGN.md`, reference implementation `system-preview/shared/system.css` and `system.js`) into React components, builds the three app shells and the sign-in page, and gives every other feature typed API access, pack formatting and a kitchen-sink page to build against.

## User stories

**US-03.1 Same look as the prototype.** As the design owner, I see the production shell match `system-preview/` at 1280 px (all portals) and 390 px (client).
- Given the kitchen-sink route, then every component and state from `system-preview/shared/_kitchen-sink.html` renders with the same tokens and class names.

**US-03.2 Right shell per role.** As a signed-in user, I land in my portal with its navigation, tenant tag and role.
- Given Dimas Prasetyo signs in, then the sidebar shows "Asuransi Jasindo", his role under his name, and the insurer nav from PLAN 4.5.
- Given a client on a 390 px screen, then the sidebar is hidden and the mobile top bar and the 5-tab bar (Home, Farm, Cover, Claims, Wallet) show.

**US-03.3 Sign in (c01).** As a visitor, I sign in with phone or email and a code; in the sandbox I can tap a demo account.
- Given `SANDBOX=true`, then c01 shows the four demo account rows; given `false`, it does not.

**US-03.4 Installable and notifiable.** As a Client, I can add AiGRI to my home screen and allow alerts.
- Given a supported browser, then the PWA installs with the brand icons, and after I allow notifications a push subscription is stored.

**US-03.5 Accessible and calm.** As any user, I can use every shell element by keyboard and screen reader, and motion respects my settings.

## Functional requirements

- **FR-03.1** `portals/styles/system.css` shall be ported from `system-preview/shared/system.css` with the same token names, values and class names; changes only where React needs them, each marked `/* port: reason */`.
- **FR-03.2** React components shall wrap those classes: AppShell (side, topbar, mbar, tabbar), Button (y, ink, soft, ghost, danger, w; sizes; loading), Field, Input, Affix, Select, Textarea, Choice, Check, Radio, Switch, Seg, Chip, Upload, Otp, Card variants, Stat, Kv, Meter, PolicyCard, Cite, Table (with stack mode), StatusPill, Tabs, Banner, EmptyState, Skeleton, ErrorState, CheckList, Toast region, Stepper, Timeline, Map (D-13), ParcelTile, SatelliteCompare, Chart (bars, line+area, stacked bar, sparkline, with "Show as table"), PhotoGrid and Photo, Consent, Hash, Avatar, InsMark, DemoNote, SandboxPill, Modal, Sheet, Disclosure (accordion), CountUp, SunRise logo. Each component lives in `portals/components/<Name>/` with a story-like example on the kitchen-sink page.
- **FR-03.3** The behaviours that `system.js` provides declaratively (PLAN 4.2) shall exist as React behaviour: reveal on scroll (`.rv`), topbar shadow, tabs with arrow keys, segmented control, sheet and modal open/close with focus trap and return, toasts (max 3, 4 s, pause on hover), copy to clipboard, count-up, chart draw, satellite compare with one sweep, single and multi select groups, flows with steppers, disclosure animation, still mode (`?still` and `html[data-still]`).
- **FR-03.4** `lib/pack` shall provide the formatters with the same outputs as the backend (shared `format-cases.json`), reading the pack from `/api/v1/packs/{code}`. Components shall never print a currency symbol, unit, time-zone label, regulator or rail name except through it.
- **FR-03.5** `lib/api` shall be a typed client generated from `openapi.json` (`openapi-typescript` types plus a small fetch wrapper) that forwards the session cookie in Server Components and maps error codes to user-safe messages.
- **FR-03.6** Navigation config `lib/nav.ts` shall contain every route in plan "Routes" for all three portals with icons and `data-nav` matching rules from PLAN 4.5; badges come from an API (`/api/v1/<portal>/badges`).
- **FR-03.7** Routes shall be protected by role: a Client cannot load an insurer route and so on; wrong role → redirect to the user's home with a toast.
- **FR-03.8** In demo mode the topbar shall show the story date and time from `/api/v1/dev/clock` ("Tuesday 24 Feb 2026, 08:30 WIB").
- **FR-03.9** PWA: web app manifest and icons from `brand/logo/final/exports/symbol/`, a service worker for web push (VAPID) and for queued Capture Page uploads (feature 06 uses it), `theme-color` white, `viewport-fit=cover`.
- **FR-03.10** The design lint script (AGENTS.md section 5) shall run in `make lint` and fail the build on a violation.
- **FR-03.11** Insurer and Superadmin routes below 1024 px show the "use a larger screen" notice (D-30).
- **FR-03.12** A `/dev` area (sandbox only) shall hold the kitchen sink, the mock inbox and the clock control.

## Non-functional

- WCAG 2.2 AA; axe has no serious or critical issues on any shell page.
- Lighthouse PWA installable; performance score at least 85 on a mid-range mobile profile for the client Home page with seeded data.
- No CSS framework; no CDN; fonts are the system stack (DESIGN.md 3).

## Screens

c01 sign-in (`system-preview/client/01-sign-in.html`), shells for every portal, `/dev/kitchen-sink` (`system-preview/shared/_kitchen-sink.html`).

## Out of scope

Dark mode (DESIGN.md: none), languages other than English.
