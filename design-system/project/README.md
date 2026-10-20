AiGRI helps farmers and agri businesses find crop and livestock cover, see risk coming, and get paid when cover applies. It serves three portals (Client, Insurer, Superadmin) across several insurers and countries. The look is calm: white space, solid fills, one idea per block. Load `tokens.css` and `components/bundle.css`, then build with the class names in `components/<Comp>/README.md`.

## Content fundamentals

**Voice**
- Write plain, short, specific sentences. "5 of your 6 parcels are in the forecast flood area." Not "Elevated hydrological risk detected."
- Say who acts. AiGRI prepares, drafts, checks, ranks and warns. The adjuster approves, asks for more or denies. The wallet receives. Never write "AiGRI approved", "AI-approved" or "Auto-approved".
- Address clients as "you" and insurers by role: "You confirm. Dimas Prasetyo (adjuster) decides."
- Give deadlines as dates: "Report by 21 Feb 2026 (7 days after the flood ends, Clause 8.1)." Not "in 7 days".
- Cite or abstain. Put a `cite` chip next to every coverage statement ("Clause 4.1"). With no clause, write "Not stated in this policy."
- Never frighten or blame. An error says what happened, what is safe and what to do next: "Satellite readings for DMK-05 didn't load. Your claim is not affected. Try again."
- Write buttons as verb plus object, with the amount when money moves: "Confirm and pay Rp13.440.000", "Approve Rp187.800.000".
- Match depth to role. Clients read "flood reading" and "crop change". Insurers and admins read "Sentinel-1 VV backscatter" and "NDVI".
- Use honorifics as Indonesians do: Pak Slamet, Ibu Sri Wahyuni.
- No exclamation marks, no emoji, no "Oops".

**Language.** Write English everywhere. Local proper nouns stay as they are (Kecamatan, BMKG, BI-FAST, AUTP) with a short English gloss the first time on a screen: "AUTP, the national rice insurance scheme". Mark whole Indonesian phrases with `lang="id"`.

**Formats (Indonesia pack, id-ID)**
- Money: `Rp6.000.000`. "Rp" with no space, dot thousands, no decimals. Signed amounts in ledgers only, with a true minus: `−Rp13.440.000`, `+Rp187.800.000`.
- Compact money in KPI tiles and chart labels only: `Rp187,8 jt` (juta), `Rp1,24 M` (miliar). Put the full amount in `title` and `aria-label`.
- Percent and area use a decimal comma: `3,5%`, `48,0 ha`. Counts use a dot: `1.284`.
- Dates: `16 Feb 2026`, with time `16 Feb 2026, 08:20 WIB`, ranges with an en dash `6–8 Feb 2026`. Never `16/02/2026`. Relative time ("2 h ago") only under 24 hours, with the absolute time in `title`.
- Coordinates `−6.8571, 110.6390`, phone `+62 812-2741-0938`, IDs `CLM-26-000418` never reformatted.

**Multi-country packs.** A country pack sets currency, locale, area unit, time zone label, regulator, payout rails, hazard sources and insurers. Indonesia is live. The Philippines, Vietnam and Thailand are planned, with empty insurer rosters. Never hard-code "Rp", "ha", "WIB", "OJK" or "BI-FAST" in a component; read them from the pack. Never invent insurer names or show insurer logos; use the neutral `ins-mark` with initials. Show the active pack quietly in the `country` chip ("Indonesia · IDR"). Policy currency is the insurer's; a converted figure is second and labelled "approx.". Any screen that shows policies ends with the `demo-note`: "Demo data. Products and prices are illustrative."

## Visual foundations

**Colour roles**
- Text: `ink` on `white`, `surface-1`, `surface-2`, `surface-3` and `cream`. Secondary text is `muted`. Use `muted-2` only on `white` or `surface-1`, at 15px and up; it falls under 4.5:1 on `surface-2` and `surface-3`.
- Surfaces: `white` page, `surface-2` cards on white, `white` cards on `surface-2`, `surface-3` for hover and pending, `cream` for the warm "with AiGRI" moment, `green` for the wallet balance, `ink` for the one decisive item.
- Brand: `green` for links, eyebrows, active nav icon, progress and selected states. `leaf` is for charts, parcels and meters only; white on `leaf` is 3.68:1, so never set text on it. For text on a green fill use `green`.
- Yellow: `sun` fills the one primary call to action per view (`btn-y`, ink label) and the logo sun. Never use it for a status, chart series, icon or highlight.
- Status: each of `ok`, `info`, `need`, `denied`, `alert` and pending has an ink and a solid `-bg`. Pair them as the tokens say, and always add a word and a dot or icon. Never colour alone.
- Map and data: `map-land`, `map-water`, `water`, `parcel`, `parcel-risk`, `parcel-off`. Chart series order: `leaf`, `water`, `ink`, `parcel-risk`; at most four.

**Solid fills, no hairlines.** Separate things with space and solid fills. No 1px borders, dashed outlines, inset rings, gradients on UI, blur, glass or coloured left-border stripes. Selected states change fill (`cream`, `ink`, `green`), never a border. The one gradient is the photo scrim on the sign-in hero.

**Type.** One system stack, `font-sans`; `font-mono` for hashes and audit IDs only. Set body in `body` (17px), secondary in `small` (15px), and 13px only for uppercase `label` and chart ticks. Set one `title` per page, `h-section` for sections, `h-card` for cards, `lead` in `muted` for intros. Use `num-xl` and `num-l` for money and KPIs with tabular numerals. Inputs are 17px so iOS does not zoom. Track in `em`. Use `text-wrap: balance` on titles and `pretty` on leads. Limit prose to 68ch.

**Spacing.** Use only `s1` to `s9` (4, 8, 12, 16, 24, 32, 48, 64, 96px). Space 8 inside components, 16 to 24 between related items, 48 between sections. Pages sit in `content-max` (1120px) with `gutter` side padding (48px, 20px at 600px and below). Sidebar `side-w` 248px, icon rail `rail-w` 76px from 601 to 1023px.

**Radii.** `r-lg` (28px) for hero cards, maps, sheets, modals. `r-md` (20px) for cards, banners, toasts. `r-sm` (14px) for inputs, tiles, photos. `r-xs` (10px) for thumbnails and reading chips. `r-pill` for buttons, pills, chips, tabs, avatars.

**Elevation.** Three levels. Flat is the default: depth comes from fill. `shadow-float` for menus, toasts, map controls and the sticky bar after scroll. `shadow-modal` for modals and sheets. `shadow-knob` for switch knobs and the compare handle. The scrim behind overlays is a solid `rgba(31,42,27,.32)`, no blur.

**Motion.** Motion explains state; it never decorates and never loops except the skeleton breathe and button loading dots while loading is real.
- Durations: press `dur-press` 160ms, colour `dur-fast` 200ms, pops and tabs `dur-ui` 240ms, sheets and toasts `dur-sheet` 320ms, exits `dur-exit` 180ms (always faster than the enter), fills `dur-reveal` 600ms, in-app reveal `dur-app-reveal` 360ms, count-up and chart draw 900ms, satellite sweep `dur-explain` 1600ms once.
- Easings: `ease-out` for entrances and responses, `ease-in-out` for on-screen movement and sweeps, `ease-drawer` for menus, sheets and toasts. Never `ease-in`, never `transition: all`, never `scale(0)`.
- Animate `transform` and `opacity` only. Hover sits inside `@media (hover:hover) and (pointer:fine)`; every pressable has `:active` with `scale(.97)`.
- Frequency decides: nav, tabs and table rows get instant colour changes and press feedback only. Count up only a balance that just changed or an approved payout.
- Reduced motion (`prefers-reduced-motion: reduce`): remove transforms, keep opacity at 200 to 300ms, reveals become a 300ms fade with no stagger, count-ups show the final value, the satellite sweep is skipped (static at 50%), sheets and modals fade only. Meaning never depends on motion.
- `html[data-still]` renders every motion in its final state for screenshots.

**Imagery.** Use real photos of fields, cattle and flooded paddy with an evidence chip (`photo-chip`: time and place), at `r-sm`. Use schematic maps and satellite frames drawn in the map tokens, not stock maps. Use real place names (Demak, Kudus, Grobogan) and plausible figures, never lorem ipsum.

## Iconography

- Use the stroke sprite from `system.js`: `<symbol id="i-NAME">` on a 24×24 grid, 2px stroke, round caps and joins, `fill:none`, `stroke:currentColor`. Reference it as `<svg class="i" aria-hidden="true"><use href="#i-bell"/></svg>`.
- Sizes: `i` 24px, `i-sm` 20px (pills, cells, buttons), `i-lg` 28px (empty states, mobile tabs).
- Names include home, farm, parcel, cow, sprout, shield, shield-check, file, file-check, file-pen, wallet, bell, settings, user, users, building, globe, search, filter, plus, minus, check, x, chevron-right, chevron-left, chevron-down, arrow-right, arrow-up-right, arrow-down-left, alert, info, clock, calendar, rain, rain-alert, flood, sun, thermometer, bug, camera, image, upload, download, satellite, layers, tag, pin, bank, send, scale, list, activity, chart, lock, eye, edit, copy, external, logout, hash, refresh.
- Pair every icon with a text label. Only `icon-btn` may stand alone, and it needs an `aria-label`.
- Icons take the text colour. Only the active nav icon uses `green`. An icon never uses `sun`.
- Put icons in a solid circle (`ico-dot`, 40px, `surface-2` or a status `-bg`). No outlined tiles. No emoji.
- The previews in this system load no script, so each one copies the few `<symbol>`s it needs inline.

## Logo

- Use the files in `assets/Logos`; never redraw the wordmark in a font. Colour horizontal (41px tall) in the sidebar, colour symbol (32px) in the mobile bar, reversed horizontal (48px) on the sign-in photo, small symbol under 32px.
- Keep clear space of one row height (about 17% of the symbol height) on every side. Minimum width 120px for the horizontal lockup.
- Use the colour version on white or `cream`; the reversed version on `green`, `ink` or a calm dark area of a photo.
- Never recolour the sun or rows, stretch, rotate, outline, add shadows, or place the colour logo on yellow or busy backgrounds.
- The logo sun is the only place `sun` appears besides `btn-y`. The sun-rise animation plays only on sign-in and when a payout arrives, never in the sidebar.

## Accessibility

- Meet WCAG 2.2 AA. Text holds 4.5:1 on its ground; graphics and focus rings hold 3:1. The known exceptions are in the token notes: `leaf` carries no text, `disabled` is exempt, and `muted-2` stays off `surface-2` and `surface-3`.
- Show a 3px `focus` ring with a 3px offset on every focusable element, `#FFFFFF` inside `ink`, `green`, toast and photo surfaces. Order focus as reading order; sheets and modals trap focus and return it to the trigger (`<dialog>` with `showModal()`).
- Make targets 44×44 at least, 48 for primary buttons and tabs.
- Give every input a visible label. Announce errors with `aria-invalid` and `aria-describedby`.
- Give charts `role="img"`, an `aria-label` summary and a "Show as table" button. Pair maps with a parcel list. Build the satellite compare on a real range input.
- Use `role="status"` on toasts and `role="alert"` once on arrival for an urgent hazard banner.
- Set `lang="en"`. Leave pinch zoom on. There is no dark mode; `color-scheme` is `light`.
