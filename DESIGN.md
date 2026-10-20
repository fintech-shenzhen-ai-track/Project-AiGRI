# AiGRI design system

This is the design spec for the AiGRI web app: the Client, Insurer and Superadmin portals. It is extracted from the approved landing page (`landing-preview/index.html`), which stays the source of truth for the look. Token names and values marked **(landing)** are copied exactly from the landing `:root`. Tokens marked **(app)** are additions for the product. Do not rename the landing tokens.

The reference implementation is `system-preview/shared/system.css` and `system-preview/shared/system.js`. The build plan is `system-preview/PLAN.md`.

---

## 1. Principles

1. **Calm first.** White space, one idea per block, and no decoration that doesn't carry meaning. The app should feel like a quiet Apple settings pane, not a trading terminal. Farmers open it on the worst week of their year.
2. **People decide, code moves money, AiGRI prepares.** Every screen makes it clear who acts. Clients confirm. Adjusters decide. Payouts follow the approval automatically. AiGRI never "approves", "decides" or "pays" in copy.
3. **Evidence over assertion.** Every number shows where it came from: a clause, a satellite pass, a photo with time and place, or a hash. Show the source next to the claim, not in a footnote.
4. **Solid surfaces, no hairlines.** Separate things with space and solid fills: white, `--surface-2`, `--surface-3`, cream, green and ink. No 1px borders, no dashed outlines, no inset rings, no translucency or blur on UI chrome.
5. **Yellow means "do this now".** `--sun` appears only on the one primary call to action on a view (`.btn-y`) and in the logo's sun. It is never a status, a chart colour, an icon or a highlight.
6. **Motion explains state.** Motion shows where something came from, what changed, or what the system is doing. It is never ambient, and it never loops for decoration. Every motion has a reduced-motion answer that is gentler, not missing.
7. **Honest data.** Real place names and plausible figures, never lorem ipsum. Policy prices are illustrative, and screens that show them say so (`.demo-note`).
8. **Built for many countries.** Money, area, dates, regulators, rails and hazard sources come from the active country pack, never from hard-coded strings in components.

---

## 2. Colour

### 2.1 Core tokens

| Token | Value | Source | Role |
|---|---|---|---|
| `--ink` | `#1F2A1B` | landing | Primary text, ink buttons, decisive cards (`.card-ink`), toasts, focus ring on light |
| `--muted` | `#44533F` | landing | Secondary text, captions, descriptions |
| `--muted-2` | `#6B7766` | app | Tertiary text: timestamps, table meta, axis labels (4.71:1 on white, 15px minimum) |
| `--disabled` | `#8E9A89` | app | Disabled text and icons only (2.94:1, exempt) |
| `--green` | `#557945` | landing | Brand green "Field green": links, active nav icon, eyebrows, progress fills, selected states, `.card-green` |
| `--leaf` | `#5D9253` | app (logo guide "Leaf green") | Illustration and data only: chart series 1, parcel fills, meters. Never text (3.68:1 on white) and never the logo |
| `--sun` | `#FFCB3D` | landing | Primary CTA fill and logo sun only |
| `--sun-press` | `#F2B91F` | landing | Hover and pressed state of `.btn-y` |
| `--cream` | `#FFF8E1` | landing | Warm highlight surface: "with AiGRI" moments, the selected consent block, upload drag-over |
| `--white` | `#FFFFFF` | landing | Page background, cards on `--surface-2` |
| `--surface-1` | `#FAFAFB` | app | Zebra rows in dense tables |
| `--surface-2` | `#F5F5F7` | landing | Cards on white, sidebar, inputs, chips |
| `--surface-3` | `#EDEDF0` | landing | Pressed or hover on `--surface-2`, pending pills, skeletons |
| `--track` | `#E3E3E0` | landing | Progress, stepper and timeline tracks, chart baselines |
| `--focus` | `#1F2A1B` | landing | Focus ring; set to `#FFFFFF` inside dark surfaces |

Legacy landing aliases (`--mist`, `--tint`, `--line`, `--sun-hover`) are **not** carried into the app.

### 2.2 Status tokens (app)

Every status has an ink colour (text and icon) and a solid background. Pills, banners and timeline pins use these pairs. Status is never colour alone: a pill always has a text label and a leading dot.

| Status | Ink token | Bg token | Contrast | Used for |
|---|---|---|---|---|
| ok | `--ok` `#3F5C33` | `--ok-bg` `#E7F0E3` | 6.44:1 | Approved, Paid, Active, Issued, Live, Verified |
| pending | `--muted` `#44533F` | `--pending-bg` `#EDEDF0` | 7.03:1 | Submitted, Under review, Draft, Planned, Queued |
| info | `--info` `#2F5F86` | `--info-bg` `#E3EDF5` | 5.71:1 | Pre-checked, satellite readings, "AiGRI drafted this" |
| need | `--need` `#7A4B00` | `--need-bg` `#FBEBCB` | 6.30:1 | Info requested, Needs action, Due soon, Needs review |
| denied | `--denied` `#9E2F25` | `--denied-bg` `#FBE5E1` | 6.03:1 | Denied, Declined, Failed, input errors |
| alert | `--alert` `#9A3A0E` | `--alert-bg` `#FCE8DC` | 5.93:1 | Hazard warnings, Over SLA, system degraded |
| alert, strong | `#FFFFFF` | `--alert` `#9A3A0E` | 7.03:1 | The one live hazard banner on Home (`.banner-alert.is-strong`) |

`--need-bg` is a warm amber, distinct from `--sun`. It never fills a button.

### 2.3 Map and data tokens (app)

| Token | Value | Role |
|---|---|---|
| `--map-land` | `#EEF2EA` | Map base land |
| `--map-water` | `#CFE0EC` | Rivers, sea and permanent water |
| `--map-road` | `#FFFFFF` | Roads (2px strokes) |
| `--water` | `#2F5F86` | Flood extent from satellite, rain series in charts (6.77:1 on white) |
| `--parcel` | `#5D9253` (= `--leaf`) | Insured parcel fill |
| `--parcel-risk` | `#C8693A` | Parcel in a forecast hazard area (3.6:1 on land, graphic) |
| `--parcel-off` | `#C9CEC6` | Uninsured or outside the policy |

Chart series order: `--leaf`, `--water`, `--ink`, `--parcel-risk`. A threshold or limit line uses `--alert` at 2px. Never more than four series. Data marks (map boundaries, chart lines, parcel outlines) may use strokes, because they are data, not UI borders.

### 2.4 Contrast summary (computed from hex)

| Pair | Ratio | Rule |
|---|---|---|
| ink on white / `--surface-2` | 14.94 / 13.72 | Body text anywhere |
| muted on white / `--surface-2` / `--surface-3` | 8.22 / 7.55 / 7.03 | Secondary text |
| muted-2 on white | 4.71 | 15px and up only |
| green on white / `--surface-2` | 4.99 / 4.58 | Links, eyebrows (13px bold caps), large numbers |
| white on green | 4.99 | `.card-green` text at 17px+ and the wallet balance |
| white on ink | 14.94 | `.card-ink`, toasts, `.btn-ink` |
| ink on sun | 9.86 | `.btn-y` label |
| leaf on white | 3.68 | Graphics only (meets 3:1 for non-text) |
| sun on white | 1.51 | Never text, never an icon |
| status pairs | 5.71 to 7.03 | All pass AA for 15px text |

Focus rings: `--ink` on light (14.94), `#FFFFFF` on `.card-ink`, `.card-green`, toasts and photo overlays.

---

## 3. Typography

One family, the system stack from the landing page. The product uses a **fixed px scale**. The landing's fluid `clamp(...vw)` heading sizes are for marketing only and are not used in the app (the app forbids `vw`).

`--font` (landing): `-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Segoe UI",system-ui,sans-serif`
`--font-mono` (app): `ui-monospace,"SF Mono",Menlo,Consolas,monospace`. Used for hashes and audit IDs only.

| Token | Desktop | ≤600px | Weight / tracking | Class | Use |
|---|---|---|---|---|---|
| `--fs-num-xl` | 56px | 44px | 700 / -0.03em, tabular | `.num-xl` | Wallet balance, approved payout |
| `--fs-title` | 34px | 28px | 700 / -0.022em | `.title` | Page title (one per page) |
| `--fs-num-l` | 34px | 28px | 700 / -0.02em, tabular | `.num-l` | KPI values |
| `--fs-section` | 24px | 22px | 700 / -0.015em | `.h-section` | Section heading |
| `--fs-card` | 19px | 19px | 600 / -0.01em | `.h-card` | Card heading |
| `--fs-lead` | 19px | 17px | 400, line-height 1.45 | `.lead` | Page intro, in `--muted` |
| `--fs-body` (landing) | 17px | 17px | 400, line-height 1.5 | body | Body text, inputs, buttons |
| `--fs-small` (landing) | 15px | 15px | 400 or 600 | `.small`, `.meta` | Secondary text, table cells, pills, captions |
| `--fs-label` (landing) | 13px | 13px | 600 / 0.08em, UPPERCASE | `.label`, `.eyebrow` | Eyebrows, table headers, field group labels |

Rules (from the landing review):
- Body floor is 17px. Secondary floor is 15px. 13px is allowed only for UPPERCASE labels and chart axis ticks.
- Inputs are always 17px, which avoids the iOS zoom.
- Tracking is in `em`, never px.
- All numbers that line up use `font-variant-numeric: tabular-nums` (`.num`).
- `text-wrap: balance` on titles; `text-wrap: pretty` on leads.
- Line length for prose: 68ch maximum (`.prose`).

---

## 4. Space, grid and breakpoints

Spacing tokens (landing): `--s1:4px --s2:8px --s3:12px --s4:16px --s5:24px --s6:32px --s7:48px --s8:64px --s9:96px`. Use only these. The common rhythm is 8 inside components, 16 to 24 between related items, 48 between sections.

| Token | Value | Notes |
|---|---|---|
| `--gutter` | 48px desktop, 20px at ≤600 | Page side padding (the landing uses 32 / 20) |
| `--side-w` (app) | 248px | Sidebar width at ≥1024 |
| `--rail-w` (app) | 76px | Icon-only sidebar from 601 to 1023 |
| `--content-max` (app) | 1120px | Max width of `.page` |
| `--topbar-h` (app) | 64px | Desktop page top bar |
| `--mbar-h` (app) | 56px | Mobile top app bar |
| `--tabbar-h` (app) | 64px + `env(safe-area-inset-bottom)` | Mobile bottom tabs |

Grid: a 12-column CSS grid with 24px gaps at desktop, collapsed to one column at ≤600. Helpers: `.grid-2`, `.grid-3`, `.grid-4`, `.split` (2fr / 1fr), `.split-r` (1fr / 2fr). At a 1280px artboard with the sidebar, the content column is 1280 − 248 − 2×48 = **936px**.

Breakpoints:

| Range | Name | Layout |
|---|---|---|
| ≤600px | mobile | Client: mobile top bar plus bottom tabs, one column. Insurer and Superadmin are not designed for this range. |
| 601 to 1023px | compact | Sidebar collapses to a 76px icon rail with tooltips. |
| ≥1024px | desktop | Full 248px sidebar. |

The ≤600 breakpoint is written inside each file with `@media (max-width:600px)`. No `vh`, `vw`, `dvh` or `svh` anywhere in the app. Heights are content-driven or in px.

---

## 5. Radii and elevation

Radii (landing): `--r-lg:28px` (hero cards, maps, sheets, modals), `--r-md:20px` (cards, table rows as pills, banners), `--r-sm:14px` (inputs, buttons in toolbars, tiles, photos), `--r-pill:999px` (buttons, pills, chips, tabs, avatars). App: `--r-xs:10px` (thumbnails inside cards, the satellite reading chips).

Elevation has three levels and nothing else:

| Level | Token | Value | Used for |
|---|---|---|---|
| 0, flat | none | none | Everything on the page. Depth comes from fill: white page, `--surface-2` card, white card on a `--surface-2` area. |
| 1, floating | `--shadow-float` (landing) | `0 8px 24px rgba(31,42,27,.10)` | Menus, popovers, toasts, map controls, the sticky top bar after scroll (as a bottom shadow, landing `.hdr::after` pattern) |
| 2, overlay | `--shadow-modal` (app) | `0 24px 64px rgba(31,42,27,.18)` | Modals and sheets |
| knob | `--shadow-knob` (app) | `0 2px 8px rgba(31,42,27,.14)` | Switch knob, segmented thumb, compare-slider handle |

The scrim behind modals and sheets is solid `rgba(31,42,27,.32)` with no blur.

**Banned:** `border` and `outline` for decoration, dashed drop zones, `inset` box-shadow rings, `backdrop-filter`, gradients on UI (the only gradient is the photo scrim on the sign-in hero, copied from the landing hero), glassmorphism, coloured left-border "accent" stripes on cards.

---

## 6. Iconography

- Style: 24×24 grid, 2px stroke, round caps and joins, `fill:none`, `stroke:currentColor`. This matches the landing's How-it-works icons.
- Sizes: `.i` 24px (default), `.i-sm` 20px (inside pills, table cells, buttons), `.i-lg` 28px (empty states, nav on mobile tabs).
- Delivery: one SVG sprite of `<symbol id="i-NAME">` elements, injected by `system.js` at the top of `<body>`. Use: `<svg class="i" aria-hidden="true"><use href="#i-bell"/></svg>`. The full list of names is in `system-preview/PLAN.md` (PKG-0).
- Icons are always paired with a text label, except in an `.icon-btn`, which must have an `aria-label`.
- Icon colour follows text colour. Only nav-active icons use `--green`. An icon never uses `--sun`.
- Icon containers: a solid circle (`.ico-dot`, 40px, `--surface-2` or a status bg). No outlined icon tiles.

---

## 7. Logo

Use the Field Watch logo from `brand/logo/final/`. In the prototype, paste the SVG paths inline (the snippets are in PLAN.md).

| Place | Version | Size |
|---|---|---|
| Desktop sidebar, all portals | Horizontal colour | 41px tall (about 121px wide, which meets the 120px minimum) |
| Mobile top bar (client) | Symbol colour | 32px |
| Sign-in hero (on photo) | Horizontal reversed (white rows and wordmark, yellow sun) | 48px tall |
| Favicon-sized uses under 32px | Small symbol (two rows, no cut) | 16 to 31px |

Rules: keep clear space of one row height (about 17% of the symbol height) on every side. Never recolour the sun or the rows, never put the colour version on yellow or busy photo areas, never rebuild the wordmark in a font. The logo sun is the only other place `--sun` may appear.

The "sun-rise" animation (rows rise in, then the sun rises) plays **only** on the sign-in screen and on the payout-arrived moment in the wallet. It never plays in the sidebar.

---

## 8. App shell

### 8.1 Desktop (all portals, ≥1024)

```
┌────────────┬──────────────────────────────────────────────┐
│ Logo       │ Top bar: breadcrumbs · search · bell · avatar │
│ Portal tag │──────────────────────────────────────────────│
│            │ .page (max 1120, padding 40 48 96)           │
│ Nav items  │   eyebrow / title / lead / actions           │
│            │   content…                                   │
│            │                                              │
│ Country    │                                              │
│ User       │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- `.side`: `--surface-2` fill, full height, sticky. Contains the logo, a portal tag (`.side-portal`, 13px caps: "Client", "Asuransi Jasindo", "Superadmin"), the nav, and at the bottom the country chip and the signed-in user.
- `.nav-item`: 44px tall, `--r-sm`, icon plus label. Active (`aria-current="page"`): white fill, ink text 600, green icon. Hover: `--surface-3`. A count badge (`.nav-badge`) is a solid `--ink` pill with white numerals; a need-attention badge uses `--need-bg`/`--need`.
- `.topbar`: white, 64px, sticky. After 8px of scroll it gains the landing header shadow (`::after` with `--shadow-float`-style inset fade, opacity 0 → 1 over 200ms). No border.
- The country chip (`.country`): `--surface-3` pill, globe icon, "Indonesia · IDR". It is the subtle, always-visible country and currency indicator required by the product.

### 8.2 Mobile client (≤600)

- `.side` is hidden. `.mbar` shows: symbol logo (32px), the page title (17px 600), and a bell `.icon-btn` with an unread dot. The mobile country indicator lives in the profile sheet and on the Wallet screen header ("Indonesia · IDR").
- `.tabbar`: fixed to the bottom, white with a top shadow (`0 -1px 0` is banned; use `0 -8px 24px rgba(31,42,27,.06)`), 5 tabs: **Home, Farm, Cover, Claims, Wallet**. Each tab is an icon (24px) over a 13px label, 48px minimum target. Active: `--green` icon and ink label 600. Alerts live behind the bell; Risk is reached from Home and Farm.
- `.main` gets bottom padding equal to the tab bar height plus 24px.

### 8.3 Insurer and Superadmin

Desktop only (designed at 1280). The same `.side` shell with portal-specific nav. The insurer portal shows the tenant name ("Asuransi Jasindo") in the portal tag and the user's role ("Claims adjuster") under their name, because what a person may do depends on the role.

---

## 9. Components

All interactive components have these states: default, hover (inside `@media (hover:hover) and (pointer:fine)` only), pressed (`:active`), focus-visible (3px `--focus` outline, 3px offset), disabled, and where relevant loading, error and selected. Class names below are the real names in `system.css`.

### 9.1 Buttons

| Class | Fill / text | When |
|---|---|---|
| `.btn.btn-y` | `--sun` / ink | The single primary action on a view: Get covered, Confirm and pay, Confirm and submit, Approve claim, Publish. **At most one per view.** |
| `.btn.btn-ink` | ink / white | Strong secondary, or the primary when yellow is already used or the action is not a commitment (Continue, Save) |
| `.btn.btn-soft` | `--surface-2` / ink | Secondary actions |
| `.btn.btn-ghost` | transparent / green | Tertiary, inline actions ("View clause") |
| `.btn.btn-danger` | `--denied-bg` / `--denied` | Deny, Remove. Never solid red. |
| `.btn.btn-w` | white / ink | On green, ink or photo surfaces |

Sizes: default 48px tall, 17px 600, padding 0 26px (landing). `.btn-sm` 40px, 15px. `.btn-lg` 56px, 18px (landing). `.btn-block` is full width (all primary buttons on mobile). `.icon-btn` is 44×44, `--r-pill`, transparent, `--surface-2` on hover.

States: hover `.btn-y` → `--sun-press`, `.btn-soft` → `--surface-3`, `.btn-ink` → `#2E3B29`. Pressed: `transform: scale(.97)` over 160ms `--ease-out` (landing). Disabled: `--surface-3` fill, `--disabled` text, no press. Loading (`.is-loading`): label kept for width but transparent, a 20px three-dot indicator in the label colour; `aria-busy="true"`. Button labels say what happens, with the amount when money moves: "Confirm and pay Rp13.440.000".

### 9.2 Inputs, selects and choices

- `.field` wraps `label.field-label` (15px 600 ink), the control, then `.field-hint` (15px muted) or `.field-error` (15px `--denied` with an alert icon).
- `.input`, `.select`, `.textarea`: `--surface-2` fill, no border, `--r-sm`, 52px tall, 17px text, padding 0 16px. Hover: `--surface-3`. Focus: white fill plus the focus ring. Error (`[aria-invalid="true"]`): `--denied-bg` fill. Disabled: `--surface-2` with `--disabled` text. Read-only (compiled policy fields): white fill with the source clause chip on the right.
- `.affix` adds a prefix or suffix inside the field ("Rp", "ha", "head").
- `.select` uses a native `<select>` with a chevron icon placed by the wrapper `.select-wrap`.
- `.choice`: a large selectable card (account type, crops or livestock, payout method). `--surface-2` fill; selected (`.is-sel`, `aria-pressed="true"`): `--cream` fill and a solid green check badge in the corner that pops in (scale .6 → 1, 240ms). Never a coloured border.
- `.check` and `.radio`: 24px solid boxes (`--surface-3`); checked is `--green` with a white tick. `.switch`: 51×31, track `--track` → `--green`, white knob with `--shadow-knob`, 200ms `--ease-out`.
- `.seg`: segmented control, `--surface-2` track, white thumb with `--shadow-knob` that slides (240ms `--ease-out`).
- `.chip`: filter chip, 36px, `--surface-2`; selected: ink fill, white text.
- `.upload`: a solid `--surface-2` tile at `--r-lg`, upload icon, title and hint. Drag-over: `--cream`. Uploading: a `.meter` under the file name. Never a dashed border.
- `.otp`: 6 separate 56px boxes, `inputmode="numeric"`, `autocomplete="one-time-code"`.

### 9.3 Cards

- `.card`: `--surface-2`, `--r-md`, padding 24px (20px at ≤600). Inside a `--surface-2` region use `.card-w` (white).
- `.card-lg`: `--r-lg`, padding 32px.
- `.card-ink`: ink fill, white text. For the one decisive item on a screen (the live alert on Home, the adjuster decision summary).
- `.card-green`: green fill, white text. The wallet balance only.
- `.card-cream`: `--cream` fill, ink text. For a "next step" band (for example "Cover that fits this risk") and the consent block.
- `.card-link`: the whole card is a link. Hover `--surface-3`, pressed `scale(.99)`. It has a trailing chevron.
- `.stat`: KPI tile. `.label` on top, `.num-l` value, then `.meta` context ("3 due in 48 h"). Optional sparkline (`--leaf`, 2px). KPI values do not count up.

### 9.4 Policy card (`.policy`)

The Curation result, used on Cover and the insurer preview.

```
[1]  Asuransi Jasindo                                   ratio 1,46
     Rice Flood & Drought Cover                         Best fit for your risk (ok pill)
     Premium Rp13.440.000 · Sum insured Rp384.000.000 · Expected payout Rp19.622.400
     Why it ranks here
       ✓ Covers flood (Clause 4.1) and drought (Clause 4.2), your two highest risks
       ✓ Pays from 10% loss (Clause 6.2)
     [Compare]  [See policy →]
```

- `.policy-rank`: 34px bold numeral in `--green`. `.policy.is-top` gets the ok pill "Best fit for your risk".
- `.policy-figures`: a 3-column `.kv` of premium, sum insured and expected payout; the ranking ratio is shown as `.num-l` with the caption "expected payout per Rp1 of premium".
- `.policy-why`: up to three reasons, each with a `.cite` chip.
- `.cite`: `--surface-3` pill, 15px, "Clause 4.1". Click opens the clause sheet with the exact clause text.
- `.policy.is-off`: not eligible. Muted text, no rank numeral, a reason line ("For farmer-group members farming up to 2 ha. Your business farms 48,0 ha.").
- Any screen showing policies ends with `.demo-note`: "Demo data. Products and prices are illustrative." (15px, `--muted-2`, centred, 48px above the end of the page).

### 9.5 Tables

- `.table`: no lines. The header row uses `.label` style (13px caps, `--muted`). Body rows are 56px tall with 15px cells. Rows alternate white and `--surface-1`, and each row has `--r-sm` rounded ends. Hover: `--surface-2`. Selected: `--ok-bg`.
- Numbers are right-aligned and tabular. IDs are 15px, 600.
- A row that needs attention gets `.is-flag` (`--need-bg` fill) in addition to its status pill.
- A clickable row has `data-href` and `tabindex="0"`; Enter opens it, and a trailing chevron shows it is a link.
- `.table-tools` above the table: tabs or chips, search, and a count ("41 open claims").
- At ≤600 use `.table-stack`: each row becomes a white card, and each cell gets its label from `data-l` (the landing comparison-table pattern).

### 9.6 Status pills (`.pill`)

30px tall, `--r-pill`, 15px 600, an 8px leading dot in the ink colour. Variants: `.pill-ok`, `.pill-pending`, `.pill-info`, `.pill-need`, `.pill-denied`, `.pill-alert`. The words are fixed by lifecycle:

- Purchase: Draft · Awaiting confirmation · Premium paid · Underwriting · Issued · Declined · Active · Expired · Cancelled
- Claim: Draft · Awaiting confirmation · Submitted · Pre-checked · Under review · Info requested · Approved · Denied · Paid · Appeal draft
- Insurer and pack: Live · Verification · Planned · Paused

Mapping: Approved, Paid, Issued, Active, Live → ok. Submitted, Under review, Draft, Awaiting confirmation, Underwriting, Planned → pending. Pre-checked → info. Info requested, Verification, Needs review → need. Denied, Declined → denied. Over SLA, Hazard → alert. When a status changes on screen, the pill cross-fades (200ms) and does not move.

### 9.7 Tabs and segmented controls

- `.tabs` (`role="tablist"`): text tabs, 44px tall, 17px. Active: ink 600. A 3px `--green` bar (`.tabs-ink`) slides under the active tab with a `transform` over 240ms `--ease-out`. There is no track line under the inactive tabs. Counts sit in a `.nav-badge`.
- `.seg`: for 2 to 4 short options that change a view in place ("This season / Next 16 days").

### 9.8 Banners and alerts

`.banner` with `.banner-ok`, `.banner-info`, `.banner-need`, `.banner-denied` or `.banner-alert`: a solid status bg, `--r-md`, padding 20px 24px, a 24px icon in a status-ink circle, `.banner-title` (17px 600), `.banner-text` (15px), and optional actions on the right (stacked at ≤600). `.banner-alert.is-strong` is the solid `--alert` version with white text, used once for a live hazard on Home. Banners enter with the standard reveal and are never animated again. A dismissible banner has a close `.icon-btn`.

### 9.9 Empty, loading and error states

- `.empty`: centred, 64px `--surface-2` circle with a 28px icon, `.h-card` title, one helpful line, and one action. Example: "No claims yet. If a flood or drought hits a covered parcel, AiGRI drafts the claim for you." [See alert settings]
- Loading: `.skel` blocks (`--surface-2`, matching radii) in the real layout's shape. While the container has `aria-busy="true"`, skeletons breathe between `--surface-2` and `--surface-3` (1600ms `--ease-in-out`, alternate). That is the one sanctioned loop, and it stops when loading ends. Reduced motion: static. No centred spinners over content.
- `.error-state`: `--denied-bg` card. It says what failed, what is not affected, and how to retry: "Satellite readings for DMK-05 didn't load. Your claim is not affected. [Try again]".

### 9.10 Maps and parcel tiles

- `.map`: an inline SVG at `--r-lg` with `--map-land` base, `--map-water` rivers (the Wulan, Tuntang and Serang rivers for Demak), white roads, parcels as polygons with a 2px white outline (data stroke). Parcel fill comes from state: `--parcel` insured, `--parcel-risk` in a forecast hazard area, `--parcel-off` not covered, and a `--water` flood-extent overlay at 0.85 opacity. Selected parcel: ink 3px outline plus a `.map-label`.
- `.map-label`: white pill, ink 15px 600, `--shadow-float`.
- `.map-ctrl`: a white stack of `.icon-btn` (zoom in, zoom out, layers) with `--shadow-float`, top right.
- `.legend`: a row of 12px solid swatches with 15px labels, under or over the map.
- `.parcel-tile`: list item. A 56px mini-shape thumbnail (`--surface-2` tile with the parcel polygon), name ("DMK-01 · Karanganyar Utara"), meta ("9,6 ha · Inpari 32 · planted 2 Dec 2025"), and a status pill.

### 9.11 Satellite before and after (`.sat`)

- A 16:10 frame at `--r-lg` with two stacked SVG layers: `.sat-before` and `.sat-after`. The after layer is clipped with `clip-path: inset(0 0 0 var(--x))` and driven by an `<input type="range" class="sat-range">` (keyboard accessible, `aria-label="Compare before and after"`).
- `.sat-handle`: a 4px white line with a 44px white knob (`--shadow-knob`).
- Corner labels in ink pills: "Before · 2 Feb 2026 · Sentinel-1" and "After · 8 Feb 2026 · Sentinel-1".
- `.sat-readings`: a row of `.reading` chips under the frame: Flooded 92% · Flood duration 9 days · Crop change (NDVI) −75% · Confidence High. Confidence uses a pill: High → ok, Medium → need, Low → pending. A Low or "No flood detected" reading always carries the line "Radar can miss water under dense rice. This does not close the claim."
- Motion: when first revealed, the divider sweeps once from 100% to 50% (1600ms `--ease-in-out`, the landing `--dur-explain` radar-scan pattern). Reduced motion: static at 50%.

### 9.12 Charts (`svg.chart`)

- Types: vertical bars (loss probability by parcel), line with area (rain forecast in mm per day), stacked horizontal bar (claims by status), sparkline.
- No gridlines and no axis boxes. A 2px `--track` baseline, direct value labels on bars (15px tabular), axis ticks at 13px `--muted-2`.
- Series colours come from section 2.3. A threshold line is 2px `--alert` with a label ("BMKG heavy-rain threshold 50 mm/day").
- Every chart has `role="img"`, an `aria-label` summary, and a "Show as table" `.btn-ghost` that reveals a `.table`.
- Motion: bars grow from the baseline (`scaleY`, 600ms `--ease-out`, 30ms stagger); lines draw (`stroke-dashoffset` with `pathLength="1"`, 900ms `--ease-out`). Once, on reveal. Reduced motion: 300ms fade.

### 9.13 Wallet balance (`.wallet-hero`)

A `.card-green` at `--r-lg`, padding 32px. Contents: `.label` "Wallet balance" plus a "Sandbox" pill (white on 20% ink); the `.num-xl` balance; `.meta` "Available now · Indonesia · IDR"; actions `.btn-w` "Withdraw" and `.btn-ghost` (white) "Add funds"; the linked account line "BCA ••••4821 via BI-FAST". Transactions follow as `.txn` rows: a 40px status circle with an arrow icon (in: `--ok-bg`/`--ok`; out: `--surface-2`/ink), title, meta (date, reference), and the amount right-aligned (`+Rp187.800.000` in `--ok`, `−Rp13.440.000` in ink). The balance counts up only when a payout has just arrived (`data-count`).

### 9.14 Stepper and timeline

- `.stepper`: horizontal steps with 28px dots on a 4px `--track` with a `--green` fill (`scaleX`, the landing How-it-works pattern). Done: green dot with a white tick. Current: ink dot with a white numeral. To do: `--track` dot with a muted numeral. Labels are 15px. At ≤600 it becomes "Step 2 of 4 · What you farm" plus a `.meter`.
- `.tl`: a vertical timeline (the landing worked-example pattern). 24px pins on a 4px track with a green fill. `.tl-item.done` has a green pin, `.is-now` an ink pin, `.is-need` a `--need` pin, `.is-denied` a `--denied` pin. Each item has `.tl-when` (13px caps, green: "16 FEB 2026 · 08:20 WIB"), `.tl-title` (17px 600) and `.tl-body` (15px muted, may hold a hash or a quote from the adjuster).

### 9.15 Modals and sheets

- Use `<dialog class="modal">` and `<dialog class="sheet">`, opened with `showModal()` so focus is trapped and Esc closes.
- Modal: centred, max 560px, `--r-lg`, padding 32px, `--shadow-modal`. Use it only for confirmation of an irreversible step (submit claim, confirm payment, deny claim). At ≤600 a modal renders as a bottom sheet.
- Sheet: bottom sheet at ≤600 (`--r-lg` top corners, a 36×5 `--surface-3` grabber, max height 88% of the window via JS-free `max-height: calc(100% - 48px)` on a fixed container); on desktop a right-side panel, 440px wide, full height. Use it for detail without leaving the page: clause text, photo detail, withdraw, capture.
- Header: title (`.h-section`) and a close `.icon-btn`. Footer actions stick to the bottom, primary on the right (desktop) or full width (mobile).

### 9.16 Toasts

- `.toast-region` sits bottom right on desktop (24px from the edges) and bottom centre on mobile, above the tab bar.
- `.toast`: ink fill, white 15px text, `--r-md`, padding 14px 18px, `--shadow-float`, a 20px status icon (ok, info, need, alert colours lightened to the white-on-ink set), an optional action (white, underlined, 600).
- At most 3 stack. Auto-dismiss after 4s, paused on hover and while the tab is hidden. `role="status"`, `aria-live="polite"`.
- Use for system confirmations ("Copied", "Payout sent to CV Tani Makmur Demak's wallet"), never for errors that need action (use a banner).

### 9.17 Smaller pieces

- `.kv`: a definition list, label 15px muted on the left (or above at ≤600), value 17px on the right.
- `.meter`: 8px track (`--track`) with a `--leaf` fill, `--r-pill`.
- `.hash`: mono 15px, truncated `7c41e9…b02d`, a copy `.icon-btn`. The full value is in `title` and `aria-label`.
- `.photo`: an evidence photo at `--r-sm` with an ink chip overlay at the bottom left: "14 Feb 2026, 07:12 WIB · −6.8571, 110.6390". A tag-read chip for livestock: "Tag GBG-0485 read".
- `.check-list`: pre-check results. Each line has an ok, need or denied icon and one sentence.
- `.consent`: a `--cream` block that states exactly what is shared, with whom, and the payload hash, with a `.check` the client must tick.
- `.avatar`: 36px circle, `--surface-3`, initials 15px 600.
- `.ins-mark`: a 40px `--surface-3` rounded square with the insurer's initials (JS, AK, SM, ACA). It is neutral on purpose: we do not use insurer logos without agreement.
- `.demo-note`: see 9.4.
- `.sandbox`: a small pending pill reading "Sandbox" next to any money movement.

---

## 10. Motion

### 10.1 Tokens (landing, unchanged)

```
--ease-out:cubic-bezier(0.23,1,0.32,1);       entrances, UI response
--ease-in-out:cubic-bezier(0.77,0,0.175,1);   on-screen movement, explanatory sweeps
--ease-drawer:cubic-bezier(0.32,0.72,0,1);    menus, sheets, toasts
--dur-press:160ms; --dur-fast:200ms; --dur-ui:240ms; --dur-reveal:600ms; --dur-explain:1600ms;
--stagger:60ms; --rise:16px;
```

App additions:

```
--dur-sheet:320ms;       sheet, side panel and toast enter
--dur-exit:180ms;        any exit (always faster than its enter)
--dur-count:900ms;       count-up of a money amount
--dur-draw:900ms;        chart line draw
--dur-app-reveal:360ms;  in-app reveal
--rise-app:8px;          in-app reveal distance
--stagger-app:40ms;      in-app stagger, max 6 steps
```

Never `ease-in`, never `transition: all`, never `scale(0)` (the minimum start is .6 for pops and .96 for modals), and only `transform` and `opacity` animate. The two exceptions are the accordion height (WAAPI, landing FAQ pattern) and the satellite clip-path.

### 10.2 Named patterns

From the landing page:

| Name | Spec | App use |
|---|---|---|
| Reveal (rise) | opacity 0 → 1, translateY 16px → 0, 600ms `--ease-out`, stagger 60ms | Sign-in only. In the app it becomes App reveal. |
| App reveal | translateY 8px → 0, 360ms `--ease-out`, stagger 40ms, at most 6 steps, once per page load, class `.rv` with `--i` | Page head and first cards |
| Press | `scale(.97)`, 160ms `--ease-out` | Every button, tab, chip and card link |
| Fill | a track with a green fill growing by `scaleX` or `scaleY` from its origin | Stepper progress, timeline, meters, upload progress |
| Pop tick | scale .6 → 1 and opacity 0 → 1, 240ms `--ease-out` | Check badges, choice selection, pre-check ticks |
| Radar sweep | a 2px white line with a 96px soft band crossing the frame, 1600ms `--ease-in-out`, once | Satellite compare on first view; "Damage Assessment running" |
| Sun-rise | logo rows rise 8px with 60ms stagger (500ms), then the sun rises from 40% below at .92 scale (900ms, 240ms delay) | Sign-in, payout arrived |
| Settle | image scale 1.06 → 1, 1200ms `--ease-out`, once | Sign-in hero photo, evidence photo opened in a sheet |
| Drawer | enter opacity plus translateY(-8px), 220ms `--ease-drawer`; exit 160ms `--ease-out`; items stagger 30ms | Account and notification menus |
| Accordion | height open 260ms, close 200ms, `--ease-out` (WAAPI), content fades in 200ms after 60ms | Clause text, pre-check details |
| Header shadow | `::after` shadow opacity 0 → 1 over 200ms after 8px of scroll | `.topbar` and `.mbar` |

New in the app:

| Name | Spec |
|---|---|
| Sheet | translateY(100%) → 0 on mobile, translateX(100%) → 0 on desktop, 320ms `--ease-drawer`; exit 180ms `--ease-out`; scrim opacity 0 → 1 over 240ms |
| Modal | opacity 0 → 1 and scale .96 → 1 from the centre, 240ms `--ease-out`; exit 180ms |
| Toast | translateY(16px) → 0 and opacity, 320ms `--ease-drawer`; exit opacity and translateY(8px), 180ms. Uses transitions so rapid toasts retarget. |
| Tab ink | the 3px bar moves by `transform: translateX() scaleX()`, 240ms `--ease-out` |
| Count-up | number from 0 (or the previous value) to the target, 900ms `--ease-out`, formatted every frame with the pack formatter. Only for a balance that just changed or an approved payout amount. |
| Chart draw | bars `scaleY` 600ms with 30ms stagger; lines dash-offset 900ms; once on reveal |
| Status change | the pill cross-fades over 200ms; the timeline fill extends to the new pin (`scaleY`, 600ms `--ease-out`), then the pin colours (200ms) |
| Skeleton breathe | `--surface-2` ↔ `--surface-3`, 1600ms `--ease-in-out`, alternate, only while `aria-busy="true"` |

### 10.3 Rules

- **Frequency decides.** Things used many times a day (nav, table rows, tabs) get only instant colour changes and press feedback. Occasional things (sheets, toasts, steppers) get standard motion. Rare moments (payout arrived, policy issued, first satellite view) may have a little delight.
- **No page-load choreography beyond App reveal.** Users are mid-task.
- **Exit faster than enter.**
- **Interruptible.** Interactive state uses CSS transitions, not keyframes.
- **Hover is gated:** every `:hover` sits inside `@media (hover:hover) and (pointer:fine)`. Every pressable has `:active`.
- **No infinite loops**, except the skeleton breathe and a button's loading dots, and only while loading is real.
- **Static capture:** `html[data-still]` (or `?still` in the URL) renders every animation in its final state, for screenshots and canvas artboards.

### 10.4 Reduced motion

Under `@media (prefers-reduced-motion: reduce)`: transforms are removed; opacity transitions stay at 200 to 300ms; reveals become a 300ms fade with no stagger; count-ups show the final value; chart draws become a 300ms fade; the satellite sweep is skipped (static at 50%); sheets and modals fade only; the tab ink jumps; Sun-rise and Settle are off; skeletons are static. Meaning never depends on motion.

---

## 11. Data formatting

All formatting goes through the country pack (`AG.fmt` in `system.js`). Static HTML is written already formatted, so pages read correctly without JS.

| Kind | Indonesia pack (id-ID) | Rule |
|---|---|---|
| Money | `Rp6.000.000` | "Rp" with no space, dot thousands, no decimals |
| Negative and signed | `−Rp13.440.000`, `+Rp187.800.000` | U+2212 minus; a sign only in ledgers |
| Compact (KPI tiles and chart labels only) | `Rp187,8 jt`, `Rp1,24 M` | jt = juta (million), M = miliar (billion); the full amount is in `title` and `aria-label` |
| Rates | `Rp280.000/ha`, `Rp200.000/head/year` | |
| Percent | `3,5%`, `92%` | Decimal comma follows the pack locale |
| Area | `48,0 ha`, `0,8 ha` | One decimal; the unit comes from the pack (Thailand: rai) |
| Counts | `1.284` | Pack thousands separator |
| Date | `16 Feb 2026` | Day, short English month, year. Never 16/02/2026. |
| Date and time | `16 Feb 2026, 08:20 WIB` | 24-hour clock plus the pack's time zone label |
| Range | `6–8 Feb 2026`, `1 Jan – 30 Apr 2026` | En dash |
| Relative | `2 h ago` | Only under 24 hours, always with the absolute time in `title` |
| Audit log | `2026-02-16 08:20:11 WIB` | ISO-style, mono |
| Coordinates | `−6.8571, 110.6390` | Decimal degrees, 4 places (coordinates keep a decimal point) |
| Phone | `+62 812-2741-0938` | |
| IDs | `CLM-26-000418`, `POL-JSD-26-004127` | Never reformatted |

Policy currency is the insurer's and is fixed on the policy. If a device in another country views it, the converted figure is labelled "approx." and shown second.

---

## 12. Multi-country

- A **country pack** sets: `currency` and its symbol, `locale`, `areaUnit`, `timezone` label, `regulator`, `payoutRails`, `hazardSources`, `insurers` (the roster), and `status` (live or planned).
- Indonesia is **live**: IDR, id-ID, hectares, WIB (UTC+7), regulator OJK (Otoritas Jasa Keuangan), payout rails BI-FAST and e-wallets (GoPay, OVO, DANA), hazard sources BMKG, BNPB InaRISK, Copernicus GFM, Sentinel-1 and Sentinel-2, Open-Meteo and GDACS, and insurers Asuransi Jasindo, Askrindo, Asuransi Sinar Mas and Asuransi Central Asia (ACA, in verification).
- The Philippines, Vietnam and Thailand are **planned**. Their insurer rosters are empty until onboarding. Never fill them with invented insurer names.
- UI rules: the active pack is always visible but quiet. On desktop it is the `.country` chip in the sidebar foot ("Indonesia · IDR"); on mobile it is in the Wallet header and the profile sheet. Components never hard-code "Rp", "ha", "WIB", "OJK" or "BI-FAST"; they read the pack. The Superadmin's Country packs screen is the only place packs are compared.
- Copy stays English everywhere. Local proper nouns (Kecamatan, BMKG, BI-FAST, AUTP) stay as they are, with a short English gloss the first time on a screen ("AUTP, the national rice insurance scheme").

---

## 13. Content voice

- **Plain, short and specific.** "5 of your 6 parcels are in the forecast flood area." Not "Elevated hydrological risk detected."
- **Second person for clients, role names for insurers.** "You confirm. Dimas Prasetyo (adjuster) decides."
- **Say who acts.** AiGRI "prepares", "drafts", "checks", "ranks", "warns". The adjuster "approves", "asks for more" or "denies". The wallet "receives". Never "AiGRI approved".
- **Dates, not durations, for deadlines.** "Report by 21 Feb 2026 (7 days after the flood ends, Clause 8.1)."
- **Cite or abstain.** Every coverage statement carries a clause chip. If there is no clause, say "Not stated in this policy."
- **Never frighten or blame.** Errors say what happened, what is safe, and what to do next.
- **Buttons are verbs plus objects**, with the amount when money moves: "Confirm and pay Rp13.440.000", "Approve Rp187.800.000".
- **Technical depth by role.** Clients see "flood reading" and "crop change". Insurers and admins see "Sentinel-1 VV backscatter" and "NDVI".
- **Respectful names.** Use honorifics as Indonesians do: Pak Slamet, Ibu Sri Wahyuni.
- No exclamation marks, no emoji, no "Oops".

---

## 14. Accessibility

- WCAG 2.2 AA. All text pairs in section 2.4 pass. Graphics meet 3:1.
- Focus is always visible: a 3px ring, white on dark surfaces. Focus order follows reading order. Sheets and modals trap focus and return it to the trigger.
- Targets are 44×44 minimum (48 for primary buttons and tabs).
- Every input has a visible label. Errors are announced (`aria-describedby` plus `aria-invalid`).
- Status is never colour alone: text plus a dot or icon.
- Charts have text equivalents; the satellite compare uses a real range input; maps have a parcel list next to them with the same data.
- Toasts use `role="status"`. Urgent hazard banners use `role="alert"` once, on arrival.
- `lang="en"`. Indonesian place names need no lang switch, but whole Indonesian phrases do (`<span lang="id">`).
- Respect `prefers-reduced-motion` (section 10.4). No auto-playing loops.
- Mobile: `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` on pressables, `user-select: none` on buttons only, 17px inputs, `viewport-fit=cover` with `env(safe-area-inset-bottom)` on the tab bar, and pinch zoom left enabled.
- There is no dark mode. `color-scheme: light` is set on `:root`.

---

## 15. Do and don't

| Do | Don't |
|---|---|
| Use one `.btn-y` per view, on the commitment | Use yellow for highlights, badges, chart series or icons |
| Separate with space and solid fills | Add borders, dividers, dashed drop zones or inset rings |
| Put the clause chip next to the coverage claim | Hide sources in a footnote |
| Say "The adjuster decides" | Write "AI-approved" or "Auto-approved" |
| Show "No flood detected · Low confidence" with the "does not close the claim" line | Show "No damage" as an end state |
| Read money and area from the pack formatter | Hard-code "Rp", "ha" or "PHP" in components |
| Use real insurer names, synthetic products, and the demo note | Invent insurer names or show insurer logos |
| Animate with transform and opacity, once, with purpose | Loop, parallax, count up a KPI tile, or animate table rows |
| Keep body at 17px and labels at 15px or more | Use 12 to 14px body text to fit more in |
| Use `--surface-2` cards on white, white cards on `--surface-2` | Use green-tinted page backgrounds or stack greens |
| Write dates as `16 Feb 2026, 08:20 WIB` | Write `16/02/26` or "in 3 days" without the date |
| Use a sheet for detail, a modal only for irreversible confirmation | Open a modal as the first idea |
