# AiGRI landing page review

Page: `landing-preview/index.html` (538 lines, standalone HTML/CSS/JS)
Date: 2026-10-20

How this review was made:
- I read the whole file.
- I loaded these skill lenses: `impeccable` (critique), `emil-design-eng`, `find-animation-opportunities` and `apple-design` (HIG `motion.md` and `accessibility.md`). `review-animations` can't be called by an agent; it only runs when you invoke it yourself. Its job (auditing motion that already exists) is covered in section 3, using the Emil framework.
- This was a single-context run with no isolated sub-agents. The impeccable detector did run; see Appendix A.
- Screenshots: headless Chrome at 1440 wide, plus a settled copy with animations off (kept in the session scratchpad, not in the project). Mid-animation captures are in `review/shots/`.
- Headless Chrome on Windows has a minimum window width of about 500px, so the "390px" captures really laid out wider. Mobile findings below therefore come from the CSS, not from those images.
- Contrast ratios were computed from the hex values, not estimated.

---

## 1. Verdict

The page is clean and calm, and most of it already follows the owner's direction: large display type, white space, honest copy, no invented numbers, placeholders in brackets, and the adjuster stays in charge in every section. It still reads as a well-made template more than a product with a point of view.

There are three groups of problems:
- **Brand.** The brand rules are broken in about eight places: yellow is used beyond "Get covered", there are hairline borders, the header is translucent, and the old leaf mark is still in use.
- **Bugs.** Every "Get covered" button links to the hero button itself. Keyboard focus is invisible on the two dark sections. All content below the hero stays at opacity 0 if JS or the observer does not run.
- **Motion.** The budget goes on generic fade-ups, an endless Ken Burns zoom and a bobbing arrow, while the one scene that needs motion (a satellite seeing a flood) is a static "video placeholder". There are six orphaned keyframes (`cloud`, `rain`, `sat`, `beam`, `flood`, `pulse`) from an illustration that was removed.

**Single biggest weakness:** the page tells the same five-step story four times:
- How it works (5 steps)
- Worked example (4 steps)
- Without/With table (5 rows)
- Insurer swimlane (5 steps)

Meanwhile the satellite section, the thing only AiGRI can show, gets a still photo with a fake play button. Cut the repetition down to one strong telling. Spend the saved attention, and the animation budget, on an animated "radar sees the flood" scene. That one change makes the page both shorter and more memorable.

---

## 2. Findings by section

Severity: **Critical** (broken or accessibility failure) / **High** (hurts trust, conversion or brand) / **Medium** / **Low**.

### 2.0 Global

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| G1 | **Primary CTA loops to itself.** The hero button has `id="get-covered"` and `href="#get-covered"`. The header button (line 286) and the final CTA (line 485) also point to `#get-covered`. So the bottom CTA smooth-scrolls the visitor about 7000px back up to the hero, and nothing happens. | Critical | impeccable: Nielsen #1 (system status) and #4 (consistency). The primary action does nothing. | Remove the `id` from the hero button. Point all three at `href="[sign-up URL]"`, or at one real `#start` section if one is planned. |
| G2 | **Focus ring invisible on dark surfaces.** `:focus-visible{outline:3px solid var(--ink)}`: ink #1F2A1B on the hero scrim (~#1A2A16) is 1.01:1, and ink on the insurer green #557945 is 2.99:1. Both are below the 3:1 non-text minimum. Keyboard users lose their place on the hero CTAs, the "Become a partner insurer" button and the hero scroll cue. | Critical | apple-design Lens 1 (`accessibility.md`): accessibility failures are Critical. WCAG 2.4.7 / 1.4.11. | Use a ring that works on both: `outline:3px solid #fff; box-shadow:0 0 0 6px var(--ink)`, or scope it: `.hero :focus-visible, .ins :focus-visible{outline-color:#fff}`. |
| G3 | **Content hidden without JS.** `.reveal{opacity:0}` is set in CSS, and only the IntersectionObserver ever removes it. If JS fails, is blocked, or a crawler or link-preview renderer takes a snapshot, every section heading and card stays invisible. My first headless capture showed exactly this: everything below the fold was faint. | High | impeccable `harden`; emil: animation must never be the only path to visible content. | Gate it: `<html class="no-js">` swapped to `js` by an inline script in `<head>`, then `.js .reveal{opacity:0;…}`. |
| G4 | **Sun yellow used beyond its two allowed jobs** (the "Get covered" button and the sun in the logo). Other uses: hero chip check icons (309-311), Step 5 node (`.hstep.last.on .hnode`), worked-example last pin (`.tl li.key .pin`), the play button (`.play`), swimlane connector stroke (line 450), the "4. Decide" card (`.lstep.dec`), the footer leaf icon (line 493), and the dead `.flow li.dec`. Yellow stops meaning "act here". | High | Brand rule; apple `branding.md` (brand colour reserved for primary actions); `color.md` ("one color means one thing"). | Check icons → white. Step 5 node and final pin → ink #1F2A1B with a white icon/dot. Play button → white with ink glyph. Swimlane line → white. Decide card → ink background, white text (14.9:1). Footer → `aigri-horizontal-reversed.svg` (its sun is the one allowed yellow). |
| G5 | **Hairline borders/outlines, against the owner's rule.** Header `border-bottom:1px rgba(85,121,69,.18)`; `.gap` `border-bottom:1px #F0E3B5`; `.cta` `border-top:1px #F0E3B5`; `.cmp` `border:1px var(--line)` plus a 1px rule on every row; `.faq` `border-bottom:1px var(--line)`; the mobile `.nav.open` border; the 3px green ring on the worked-example pins (`box-shadow: inset 0 0 0 3px`). | High | Owner preference: solid colours, no hairlines. | Separate with space and solid fills instead. Table: alternate rows white / #F7F8F4, or use per-row cards (see 2.8). FAQ: 8px gaps between items on solid #F7F8F4 rounded rows, or just 32px spacing. Pins: solid green filled dots. |
| G6 | **Translucent header** (`rgba(255,255,255,.86)` + `backdrop-filter: blur(16px) saturate(180%)`). | Medium | Owner: solid colours only. | `background:#fff`. Show scroll state with a soft shadow after 8px of scroll (see Motion M-O7), not a border. |
| G7 | **Body text too small for "Apple-like, large type."** `body` has no font-size (16px). Card body 15px (`.card p`), card subheads 14px (`.card h4`), swimlane 14px (`.lstep`), lane labels 13px, step labels 13px, credits 13px. | Medium | apple `typography.md`: the 17pt default for body. Owner: large type. | Set `body{font-size:17px}`. Floors: 17px for body, 15px for labels, 13px for eyebrow caps only. Card text → 17px. |
| G8 | **Tracking too tight at small display sizes.** h1 `letter-spacing:-3px` is a fixed px value: -3.3% at 92px but **-6.5% at 46px** (mobile). h2 `-1.6px` is -4.7% at 34px. `.big` -5px. The detector flagged 8 headings. Its em values are computed against a 16px base, so the magnitude is overstated, but the mobile end really is cramped. | Medium | impeccable detector `extreme-negative-tracking`; apple `typography.md`. | Use em: h1 `-0.035em`, h2 `-0.028em`, `.big` `-0.04em`. |
| G9 | **"Muddy" green tints** used as surfaces: `--mist #F7F8F4` (two full sections plus card backgrounds), `--tint #EEF4EA` (icon tiles), `#E3ECDF` (step nodes), and the insurer lanes `#4C6D3E` / `#3F5C33` plus `#46663A` logo tiles: three greens stacked on green. | Medium | Owner: white backgrounds, not muddy green tints. | Sections on white; use `#F5F5F7` (neutral, Apple-grey) where a second surface is needed. Insurer section: one green #557945 with white cards; drop the lane fills (see 2.9). |
| G10 | **Invalid list markup.** `<ol class="htl">` and `<ol class="tl">` contain `<span>` children (track and fill). Only `<li>` is allowed in an `<ol>`; screen readers can miscount items. | Medium | apple `accessibility.md` (VoiceOver structure). | Move the track and fill spans onto a wrapper `<div>` around the `<ol>`. |
| G11 | **Dead code (~45 lines):** `.story`, `.step`, `.phone`, `.island`, `.screen`, `.scr-*`, `.ph-tag`, `.progress`, `.dots`, `.dot`, `.note`, `.flow*`, `.band*`, `.cloud`, `.rain`, `.sat`, `.beam`, `.flood`, `.pulse` and their keyframes, `--leaf`. `.btn-ow` and `.btn-w` are identical. The two `@media (max-width:880px)` blocks should be merged. | Low | emil: craft and maintainability. | Delete. Reuse the keyframe idea in the satellite scene (M-O1). |
| G12 | **No favicon, meta description or og:image.** | Low | impeccable `harden`. | Add `aigri-symbol-small-color.svg` as the icon, a 1-sentence description, and a 1200×630 og image. |

### 2.1 Header

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| H1 | **Old leaf icon plus system-font "AiGRI" text** instead of the Field Watch logo (`brand/logo/final/aigri-horizontal-color.svg`). The same leaf also appears as the "Crops" card icon, so the logo is reused as an illustration. | High | apple `branding.md` (logos don't repeat); brand consistency. | `<img src="../brand/logo/final/aigri-horizontal-color.svg" alt="AiGRI" height="28">` (copy it next to the page for deploy). Change the crops icon to a rice-stalk glyph, or remove it (see 2.4). |
| H2 | No current-section state in the nav: 5 anchors with no scrollspy. | Low | Nielsen #1. | IntersectionObserver over the sections; set `aria-current="true"` and colour the active link ink-on-#F5F5F7. |
| H3 | Header CTA is 40px tall (`.hdr-cta .btn{min-height:40px}`). On mobile it is below the 44px target. | Medium | apple `accessibility.md`: 44×44pt on mobile. | 44px at ≤880px. |
| H4 | The mobile menu snaps open and closed. It does not close on Escape or on outside click, focus does not move into it, and the hamburger icon never becomes an X. | Medium | apple Lens 4 (modality: obvious way out); HIG keyboard support. | Add Esc and outside-click to close, return focus to the button, morph the icon (M-O6). |

### 2.2 Hero

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| He1 | **Scrim makes the field olive and muddy.** The gradient is 0.62 → 0.58 → 0.82 alpha of #12220E over the whole image. In the capture the bright paddy reads khaki. The photo is the brand's best asset and it is buried. | High | Owner: no muddy greens; impeccable: let imagery lead. | Weight the scrim to the bottom only: `linear-gradient(180deg, rgba(18,34,14,.15) 0%, rgba(18,34,14,.1) 40%, rgba(18,34,14,.75) 100%)`, and keep the text block in the lower 45%. Check that white text stays at 4.5:1 or better over the brightest grass under the subhead. |
| He2 | **Too many things in one viewport:** eyebrow, 2-line h1, 27-word subhead, two equal-weight pills, three chips, and a bobbing cue. The white "See how it works" pill has the same size and weight as the primary button, so the visitor gets two options of equal weight. | Medium | impeccable cognitive load (1 primary, at most 1 secondary); owner: one idea per section. | Subhead to ≤18 words, e.g. "Policies ranked for your risk. Alerts before the storm. Claims filed with satellite and photo proof." Make the secondary a text link with a chevron (white, 17px). Keep one chip ("The insurer's adjuster decides"), or move the three promises under the CTA as plain 15px text. |
| He3 | Chips are `display:none` below 560px, so phones lose "The insurer's adjuster decides", the page's core trust promise. | Medium | Trust at the decision point (impeccable emotional journey). | Keep one line of plain text under the buttons on mobile. |
| He4 | The h1 is the likely LCP element, and it starts at opacity 0 with a 150ms delay and a 900ms fade (`.rise2`). LCP is pushed back about 1s. | Medium | impeccable `optimize`. | Animate only `transform` on the h1 (translateY 12px → 0, opacity stays 1) so it paints immediately; keep the fade for the eyebrow, subhead and buttons (see M-A2). |
| He5 | On mobile two `btn-lg` pills sit side by side and wrap unevenly at 390px. | Low | Layout. | At ≤560px make the buttons full-width, stacked, primary first. |
| He6 | Copy uses "real risk" (hero, table row 1) but "predicted risk" (step 2). Rankings are predictions, so "real" overclaims. | Medium | Owner: no invented claims; consistency. | Use "your risk" or "your predicted risk" everywhere. |

### 2.3 How it works timeline

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| T1 | **"Five steps. You only act on two of them." is false.** The user acts on step 1 (map, list, tag), step 2 (choose a policy), step 4 (confirm the packet) and arguably step 3 (take the alert steps). | High | Owner: no invented statements; trust. | "Five steps. AiGRI does the heavy lifting." Or count correctly: "You act on three. AiGRI handles the rest." |
| T2 | The grey track `#EEF2EA` on white is **1.13:1**, so it is invisible, and the "progress" story only works once the green fill arrives. | Medium | WCAG 1.4.11 non-text 3:1 for meaningful graphics. | Track `#E3E3E0`, solid and not green-tinted, at 4px. It is a hint, so 1.5:1 is acceptable, but give the fill a real start state too (nodes un-lit = white with an ink 2px icon, no ring). |
| T3 | Step 1 is lit at load (`hp>=k/4-0.001` with k=0 is always true), so progress starts already "on". | Low | State indication should begin at zero. | Light step k when `hp >= k/4 + 0.02`, or light it when the fill reaches the node centre. |
| T4 | Mobile drops all motion: nodes are forced green, there is no fill and no sequencing. Desktop gets the story, phones (the primary device for farmers) get a static list. | Medium | Owner: animation matters; motion should follow layout. | Vertical fill on mobile, the same as the worked example (M-O2). |
| T5 | Text-centred 5-column descriptions at 16px wrap to 3-4 lines ("Ranked for your predicted risk, with the reason for each rank."). | Low | Readability. | Keep the h3 and cut each description to ≤8 words, or drop the descriptions on desktop and let the h3s carry it (one idea). |

### 2.4 Protection gap (PHP 4.13B)

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| P1 | This is the strongest section, but it is a typographic "big number + label" pattern with nothing that *shows* "under 5%". | Medium | apple craft lens: "big number over small label" template; impeccable specificity. | Add one bar under the sentence: a full-width #E9E9E6 track with a **4.5%** green fill (187M / 4.13B = 4.53%), labelled "Insured: PHP 187M". It is honest, derived from the cited numbers, and animatable (M-O3). |
| P2 | Vertical alignment: `align-items:center` puts the 128px numeral's baseline about 30px below the text's first line (visible at 1440). | Low | Craft. | `align-items:flex-end`, or a stacked layout: number on top, sentence below at max-width 720px. Stacking is more Apple-like and one-idea. |
| P3 | Cream band plus a hairline `border-bottom:#F0E3B5`. | Low | G5. | Remove the border. Cream is a brand colour, so keep it, but make it the only cream band apart from the CTA, or switch to white for the "white backgrounds" rule. |
| P4 | **Verify the source.** The figures (PHP 4.13B, 1-26 Aug 2026, PHP 187M, >60% uninsured) should match the Insurance Business Asia article word for word. The link text "Source: Insurance Business Asia" should name the article, and it should open the report, not just a news page, if one exists. | Medium | Owner: no invented statistics. | Check the figures against the article and add the publication date. |

### 2.5 Crops / livestock

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| C1 | **Each card holds about 5 ideas** (photo, icon tile, title, subtitle, plus three labelled sub-sections at 14/15px). That is a spec sheet, not "one idea per section". | High | Owner: short copy, one idea; impeccable cognitive load (chunking). | Keep the photo, title and one 17px line ("Rice, corn and high-value crops. Proof from satellite and in-app photos."). Move the register/pays/proof detail into the app or the FAQ. |
| C2 | Icon tiles (40×40 #EEF4EA rounded squares) above or next to the headings. The detector flagged `icon-tile-stack` ×2, and they duplicate the photo above them. | Medium | impeccable detector (AI feature-card template). | Remove the icon tiles. |
| C3 | The crops card reuses `hero.jpg` (the same paddy as the hero, about 1000px earlier). | Medium | Craft: repeated imagery feels like a stock template. | Use a different crop photo (corn or a close-up of rice panicles), or the flooded-field photo's "before" twin. |
| C4 | `.two{max-width:960px}` inside the 1160px wrap leaves a 200px empty strip on the right while everything else spans the full width. | Low | Layout alignment. | Full width (`max-width:none`), or centre both cards. |
| C5 | Mobile bug: `.card` padding becomes 28px at ≤880px but `.card-img` still uses `-26px` margins and `calc(100% + 52px)`, so the photo sits 2px inset from the card edge with a 2px top gap. | Low | Craft. | Use a variable: `.card{--p:26px;padding:var(--p)}`, `.card-img{margin:calc(-1*var(--p)) calc(-1*var(--p)) 20px;width:calc(100% + 2*var(--p))}`. |
| C6 | Card images are 180px tall, which looks like a thumbnail strip at 470px card width. | Low | Apple-like imagery. | 260px desktop, 200px mobile. |

### 2.6 Worked example

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| W1 | **It isn't an example.** The heading says "One farm, one typhoon. Illustrative example. Not real data." but there is no farm, no typhoon and no data. It is four generic headings that repeat How it works. | High | Biggest-weakness duplication; impeccable distill. | Either make it concrete with bracketed placeholders ("[Juan], [2.5 ha] of rice in [Nueva Ecija]. Typhoon [name], [date]. Alert 48 h before → photos → [62%] flood reading → claim packet → adjuster approves PHP [amount]") or **cut the section** and fold the one good beat ("You confirm, the adjuster decides, you get paid") into How it works. |
| W2 | Pins are white with a 3px green ring (outline style), and the last pin is yellow. | Medium | G4, G5. | Solid green dots that fill as the line passes; last dot ink. |
| W3 | Pins never change state as the fill passes them. The fill is decorative, not a status. | Low | State indication. | Toggle `.reached` when the fill height passes a pin's offsetTop (M-O2). |

### 2.7 Satellite proof / video

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| S1 | **The signature moment is a dead placeholder.** A yellow play `<button>` with no handler sits over a darkened photo with "[Video placeholder] … 30 s". Clicking does nothing, which breaks the affordance. | High | Nielsen #1; apple Purpose principle; owner: animation is important. | Until a video exists, replace it with a **looping explanatory animation built in CSS/SVG**: radar sweep plus flood mask over `flooded.jpg` (M-O1). If the video stays, make the button open it and say "Coming soon" honestly. |
| S2 | The play button is sun yellow (G4) and has a hover `scale(1.06)` that isn't gated to hover-capable pointers, and no `:active`. | Medium | emil: hover gating, press feedback. | White button, ink glyph; `:active{transform:scale(.96)}`; gate hover with `@media (hover:hover) and (pointer:fine)`. |
| S3 | The video overlay `rgba(18,34,14,.55)` muddies the most dramatic photo on the page. | Medium | He1. | 0.25 overlay, with the caption in a solid ink pill (`#1F2A1B`, 15px white). |
| S4 | **Naming tension:** the section is called "Satellite *proof*" while its own third column says "Never the final word… A reading of no flood never closes a claim." | Medium | Trust: the copy contradicts itself. | Rename to "Satellite evidence", nav label "Satellite checks". Keep the honest third column; it is the best copy on the page. |
| S5 | The three columns are 16px muted text, small relative to the 52px h2. | Low | G7. | 17px body, 22px h3. |

### 2.8 Comparison table

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| X1 | It is the third telling of the same 5 steps (choose, warn, evidence, claim, paid). | High | Biggest weakness. | Keep it only if How it works becomes icon-only. Better: cut the table, put a single "Without AiGRI" line under each How-it-works step, or keep just the 2 most painful rows ("Storm warning: the news, and luck." / "Evidence: photos in a chat"). |
| X2 | Hairline frame and row rules (G5). The "Without" header cell has no background next to the solid green "With" cell, which looks unfinished. | Medium | Owner rule. | Remove the borders. Without column on #F5F5F7, With column on white with an ink-on-green header; rows separated by 1px of *background* gap, not lines. |
| X3 | **Mobile:** a 3-column table at 390px gives ~100px columns, 4-word lines and an inner horizontal scroll inside a rounded bordered box. | High | apple Flexibility; impeccable adapt. | At ≤880px render each row as a card: the row label as a 15px eyebrow, then "Without: …" in muted, then "With: …" in ink with a check. Pure CSS: `display:block` on tr/td with `td::before{content:attr(data-label)}`. |

### 2.9 Insurers swimlane

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| I1 | **Mobile layout bug:** at ≤880px `.lanes` becomes `flex-direction:column`, but `.lstep{align-self:center}` remains, so every card shrinks to its content width and centres. The result is ragged, staggered card widths (visible in the capture). | High | Craft / adapt. | `@media (max-width:880px){.lstep{align-self:stretch}}`. |
| I2 | Three greens (section #557945, lanes #4C6D3E / #3F5C33) plus #46663A logo tiles look muddy and low contrast between surfaces. | Medium | G9. | Drop the lane fills (no divider lines either). Keep one green background; label rows "Your team" / "AiGRI" in 15px white caps at the left; cards white; the Decide card ink. |
| I3 | Yellow connector line and yellow Decide card (G4). | High | Brand rule. | White connector (stroke 3px); Decide = ink #1F2A1B card, white text. That gives a stronger hierarchy than yellow, and is honest about who decides. |
| I4 | Connector geometry uses `preserveAspectRatio="none"` with hard-coded y=90/270 while the cards are centred with `margin-top:24px`, so line ends hit the cards about 12px above their centre, and between 880 and 1000px the 5 columns get cramped (~150px cards, 14px text). | Low | Craft. | Raise the 5-column breakpoint to 1100px; compute the path from card rects in JS on resize, or drop the margin-top so the centres match. |
| I5 | The headline "Reach agri clients. Decide claims with the evidence already attached." is two ideas in 11 words. | Low | Owner: one idea. | "Decide claims with the evidence already attached." Move "Reach agri clients" into the lead. |
| I6 | Logo placeholders on dark green tiles read as disabled buttons. | Low | Craft. | Use white tiles with ink "[Insurer logo]" text, or hide them until real partners exist (placeholders can suggest partners who don't exist yet). |

### 2.10 FAQ

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| F1 | Answers snap open with no height transition; only the plus rotates. | Medium | emil: prevent jarring changes. | M-O5. |
| F2 | The FAQ column sits at max-width 940px, centred, so its left edge (~282px at 1440) does not line up with every other section (172px). | Medium | Layout consistency. | Keep the 1160 wrap and limit `.faq` text to max-width 760px, left-aligned with the rest. |
| F3 | Hairline dividers (G5). | Medium | Owner rule. | Remove; use 8px gaps between #F5F5F7 rounded rows (radius 20px), or plain spacing. |
| F4 | A farmer's top questions are missing: "How fast is the payout?", "Do I need a smartphone?" (bracketed placeholders are fine). | Low | Persona (first-time farmer). | Add 1-2 placeholders; keep it ≤7 items. |

### 2.11 CTA

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| A1 | The button is broken (G1). | Critical | — | See G1. |
| A2 | Cream band plus a hairline top border; centred while every other section is left-aligned. The centring is fine for a closing CTA, but the border is not. | Low | G5. | Remove the border. Consider using `hero.jpg`'s "after the storm" counterpart, or keep plain cream. Fine as is. |
| A3 | This is the peak-end moment of the page and has no motion or reassurance. | Low | impeccable emotional journey (peak-end). | Add one quiet line under the button: "You confirm every claim before it is sent." It is true and already stated elsewhere. Plus the sun-rise logo moment (M-O4) can live here instead of the header. |

### 2.12 Footer

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| Fo1 | Old leaf icon in **yellow**, rendered as a `div` (not a link), with system-font text. | High | H1, G4. | `aigri-horizontal-reversed.svg`, linked to `#top`. |
| Fo2 | 40px vertical padding after 112-120px sections feels abrupt and cramped. | Low | Rhythm. | 72px top, 48px bottom. |
| Fo3 | Footer links are 15px with no padding, so the tap target is about 22px tall. | Medium | apple 44pt on mobile. | `padding:12px 0` on each link at ≤880px. |

### 2.13 Mobile (≤880px)

| # | What's wrong | Sev | Why | Fix |
|---|---|---|---|---|
| M1 | The swimlane cards are ragged (I1). | High | — | `align-self:stretch`. |
| M2 | The table is cramped and scrolls inside a box (X3). | High | — | Stacked row cards. |
| M3 | The trust chips are hidden (He3). | Medium | — | Keep one line. |
| M4 | The How-it-works motion is removed entirely (T4). | Medium | — | Vertical fill. |
| M5 | The menu has no animation, no Esc, no focus handling (H4). | Medium | — | M-O6. |
| M6 | Hero `min-height:88vh` on iOS Safari uses the largest-viewport `vh`, so the CTA can sit under the toolbar. | Low | mobile-native (100vh bug). | `min-height:88svh` with an 88vh fallback. |
| M7 | Hover styles (`.nav a:hover`, `.btn-ow:hover`, `.play:hover`) stick after a tap on touch devices. | Low | emil: hover gating. | Wrap them in `@media (hover:hover) and (pointer:fine)`. |
| M8 | Duplicate `@media (max-width:880px)` blocks; phone-story rules are dead (G11). | Low | — | Merge and delete. |

---

## 3. Motion

Shared tokens to add once (from the emil vocabulary), and use everywhere instead of `ease` / `ease-out` / ad-hoc curves:

```css
:root{
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entrances, UI response */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement, explanatory sweeps */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* menus, sheets */
}
```

### 3.1 Audit of every existing animation

| ID | Element | Purpose | Duration / easing | Interruption | Reduced motion | Verdict |
|---|---|---|---|---|---|---|
| M-A1 | `.reveal` scroll fade-up (every section head, cards, video, table, lanes, CTA) | Prevent jarring appearance / pacing | opacity 800ms `ease`; transform 800ms `cubic-bezier(.2,.7,.2,1)`; 28px | One-shot (unobserved), fine | Content forced visible, good | **Too slow, too far, mismatched curves, no stagger, JS-dependent (G3).** Whole blocks (the entire table, the entire swimlane) move as one slab. |
| M-A2 | Hero `.rise/.rise2/.rise3` | Entrance | 900ms `ease-out`; delays 0 / 150 / 300ms. **Subhead, buttons and chips all share 300ms**, so the stagger collapses. | n/a (load) | Killed | Too slow, delays LCP (He4), broken stagger. |
| M-A3 | Hero image Ken Burns `kb` | Ambient life | 28s ease-in-out, **infinite alternate**, scale 1→1.08 | Never stops, keeps running off-screen | Killed | It looks fine, but it is infinite decoration on a full-bleed 1440×820 layer. HIG `motion.md`: "Don't add motion for the sake of adding motion." Keep as one 20s pass, pause off-screen. |
| M-A4 | Scroll cue `bob` | Affordance ("scroll") | 2.2s ease-in-out infinite, 8px | Never stops | Killed | Infinite, and still bobbing for anyone who reads the hero for 30s. Limit to 3 iterations after a 2s delay; fade out at scrollY > 40. |
| M-A5 | `.btn` transitions + `:active scale(.98)` | Feedback | bg/color 200ms default ease; transform 150ms | Transitions retarget, good | Killed (should keep colour) | Good. Tweak: transform 160ms `var(--ease-out)`, scale .97. |
| M-A6 | `.play:hover scale(1.06)` | Hover affordance | 200ms default | ok | Killed | Not hover-gated, no `:active`, on a non-functional button (S1). |
| M-A7 | How-it-works fill (`.htl-fill` width) + `.hstep.on` node colour | State indication (scroll-linked) | **width** transition 150ms linear (animates layout); node bg 300ms | Scroll-bound, but the 150ms transition makes it lag behind the scroll | Transition killed, fill still scroll-bound (ok) | Animates `width` → layout per frame. Use `transform:scaleX()`. Remove the transition (scroll is the timeline). Nodes light with no physical response. |
| M-A8 | Worked-example fill (`.tl-fill` height set from JS) | State indication | No transition; `height` per scroll frame (layout) | Scroll-bound | Fine | Use `scaleY`; pins don't react (W3). |
| M-A9 | FAQ `.plus` rotate 45° | State indication | 250ms default ease | Transition, good | Killed | Good. 200ms `var(--ease-out)`. The panel itself snaps (F1). |
| M-A10 | `.nav a:hover` bg, `.menu-btn:hover` | Hover | none (instant) | — | — | Fine as instant. |
| M-A11 | Dead: `.cloud`, `.rain`, `.sat`, `.beam`, `.flood`, `.pulse`, `.screen` transitions, `.progress span`, `.step` | — | — | — | — | Delete, or revive the idea in M-O1. |

Reduced-motion block. The current rule is `*,*::before,*::after{animation:none!important;transition:none!important}`. It is a blunt off switch: it also kills the colour and opacity feedback that helps comprehension. Reduced motion means gentler motion, not no motion (emil › Accessibility; HIG `motion.md`: "Make motion optional").

Before / after (emil review format):

| Before | After | Why |
|---|---|---|
| `.reveal{transition:opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); transform:translateY(28px)}` | `.js .reveal{opacity:0;transform:translateY(16px);transition:opacity 600ms var(--ease-out),transform 600ms var(--ease-out)}` | Same curve on both properties, 600ms is enough for marketing, 16px is calmer, gated on JS. |
| Section reveals as one slab | Children stagger: `.reveal-group > *{transition-delay:calc(var(--i)*60ms)}`, set `--i` inline (0..4), max 4 items, 60ms | emil stagger 30-80ms; cards, step columns and swimlane cards arrive in reading order. |
| `.rise .9s ease-out` with delays 0 / .15 / .3 / .3 / .3 | eyebrow 0, h1 60ms, sub 120ms, buttons 180ms, chip 240ms; `animation: rise 600ms var(--ease-out) both`; h1 keeps opacity 1 and only translates 12px → 0 | Real stagger; LCP text visible at first paint. |
| `animation: kb 28s ease-in-out infinite alternate` | `animation: kb 20s var(--ease-out) 1 both` (scale 1.06 → 1, a settle-in rather than an endless zoom) + pause with `animation-play-state:paused` when the hero leaves the viewport | One purposeful "camera settles on the field" move; no endless decoration. |
| `.cue{animation:bob 2.2s ease-in-out infinite}` | `animation: bob 1.6s var(--ease-in-out) 2s 3` + JS adds `.hide` (opacity 0, 200ms) at scrollY > 40 | Affordance that stops once understood. |
| `.htl-fill{width:…;transition:width .15s linear}` | `.htl-fill{width:80%;transform-origin:left;transform:scaleX(var(--p));}` with no transition; JS sets `--p` on the element itself | transform-only; scroll is the clock; no lag. |
| `.tl-fill{height:Npx}` | `height:calc(100% - 20px);transform-origin:top;transform:scaleY(p)` | Same as above. |
| `.btn{transition:background .2s,color .2s,transform .15s}` `.btn:active{scale(.98)}` | `transition:background-color 200ms ease, transform 160ms var(--ease-out)`; `:active{transform:scale(.97)}` | Exact properties; emil press values. |
| `.play:hover{scale(1.06)}` | `@media (hover:hover) and (pointer:fine){.play:hover{transform:scale(1.04)}} .play:active{transform:scale(.96)}` | Hover gating plus press feedback. |
| `.faq .plus{transition:transform .25s}` | `transition:transform 200ms var(--ease-out)` | Snappier state change. |
| `@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}` | Keep opacity and colour: `.reveal{transform:none!important;transition:opacity 300ms ease!important}`; `.hero img,.cue{animation:none}`; the satellite scene shows its final "after" frame with a still mask; the fills stay scroll-bound (user-driven) | Gentler, not zero; meaning never carried by motion alone. |

### 3.2 Animation opportunities (gated: frequency → purpose → speed → function)

A landing page is a once-or-twice visit, so every item below is in the "Rare / first-time" or "Occasional" tier. Ordered by leverage.

| # | Location | Today | Purpose | Frequency | Suggested motion (exact) |
|---|---|---|---|---|---|
| **M-O1** | Satellite section, `figure.video` (line 400) | Static darkened photo + dead play button | **Explanation**: radar sees flood through cloud, before vs after | Rare (once per visit) | Replace the overlay with an SVG/CSS scene over `flooded.jpg`, played once when ≥40% visible, re-playable by a "Replay" text button. **(1) Cloud layer:** a solid white #FFFFFF shape at opacity .85 covering the top 60%, `translateX(0 → -8%)`, 1200ms `var(--ease-in-out)`. **(2) Radar sweep:** a 3px-wide ink #1F2A1B vertical bar, `transform:translateX(0 → 100cqw)`, 1600ms `var(--ease-in-out)`, start +300ms. **(3) Flood mask:** a solid #557945 (opacity .55) layer shaped to the water, revealed behind the sweep by `clip-path:inset(0 100% 0 0) → inset(0 0 0 0)`, same 1600ms and curve, start +300ms. **(4) Reading chip:** "Flood detected · confidence [high]" pill (ink bg, white 15px), `opacity 0→1; translateY(8px→0)`, 300ms `var(--ease-out)`, start +1900ms. **(5) Hold** the final frame; no loop. Reduced motion: render the final frame statically. This is the page's signature moment. |
| **M-O2** | How it works (desktop + mobile), worked example pins | Fill animates `width`/`height`; nodes and pins don't respond; mobile has no motion | **State indication** | Occasional (scroll-linked) | Fill: `transform:scaleX(p)` (desktop) / `scaleY(p)` (mobile, add a 4px vertical track left of the nodes at `left:27px`), no transition. On the frame a node becomes `.on`: background → green over 200ms `ease`, and the icon does a single `transform:scale(.9 → 1)` 240ms `var(--ease-out)` (from .9, never 0). Worked-example pins: fill solid green when reached, same 200ms. Progressive enhancement: `animation-timeline: view(); animation-range: entry 20% cover 60%` where supported, with the JS fallback. |
| **M-O3** | Protection gap: new "under 5%" bar (P1) | The number just fades in | **Explanation** (makes "under 5%" visible) | Rare | On enter: track appears with the section reveal; the 4.5% fill `transform:scaleX(0 → 1)` (origin left), 900ms `var(--ease-out)`, delay 300ms after the text. The label "Insured: PHP 187M" fades `opacity 0→1` 200ms at the end. No count-up (see rejected). |
| **M-O4** | Field Watch logo sun (header, once per load; or CTA band) | The old leaf icon, static | **Delight** (brand moment, rare) | Once per page load | Inline the SVG; the sun element `transform:translateY(6px) scale(.92) → none; opacity .0 → 1`, 600ms `var(--ease-out)`, delay 200ms. The stepped field rows stay still. Never repeats on scroll. Reduced motion: none. |
| **M-O5** | FAQ `<details>` panels | Snap open/closed | **Preventing a jarring change** | Occasional | Chrome/Edge 131+: `:root{interpolate-size:allow-keywords}` `.faq::details-content{block-size:0;overflow:hidden;transition:block-size 260ms var(--ease-out),content-visibility 260ms allow-discrete}` `.faq[open]::details-content{block-size:auto}`. Answer `p`: `opacity 0→1`, 200ms, delay 60ms. Safari fallback: snap (acceptable). Close faster: 180ms. |
| **M-O6** | Mobile menu + hamburger | Instant toggle, static icon | **Spatial consistency** + state | Occasional | Panel: `opacity 0→1; transform:translateY(-8px)→0`, 220ms `var(--ease-drawer)`; exit 160ms `var(--ease-out)` (exit faster than enter). Links stagger 30ms × 5. Icon: the 3 bars morph to an X (top/bottom `rotate(±45deg) translateY(±5px)`, middle `opacity 0`), 200ms `var(--ease-out)`. Use `visibility` + `@starting-style` so the closed menu stays out of the tab order. |
| **M-O7** | Swimlane connector path (line 450) | Static line | **Explanation**: the hand-off between your team and AiGRI | Rare | `pathLength="1"`, `stroke-dasharray:1; stroke-dashoffset:1 → 0`, 1800ms `var(--ease-in-out)` on enter. Cards stagger in as the line reaches them: `opacity 0→1; translateY(12px→0)`, 300ms `var(--ease-out)`, delays 0 / 360 / 720 / 1080 / 1440ms. The Decide card (ink) gets one extra `scale(.97→1)` 240ms. On mobile: cards only, 60ms stagger. |

Also (micro, not counted in the cap): header shadow on scroll. A `::after` with `box-shadow:0 1px 12px rgba(31,42,27,.08)`, `opacity 0→1` over 200ms `ease` when scrollY > 8. This replaces the hairline (G5) and states "content is under the bar".

### 3.3 Rejected (deliberately not animated)

- **Count-up of "PHP 4.13B".** Rejected (Function): it is a cited loss figure the reader is meant to *read*. Spinning digits on a disaster number reads as spectacle, delays comprehension, and screen readers announce the wrong values.
- **Parallax on hero, cards or flooded photo.** Rejected (Purpose): no meaning, causes motion discomfort (HIG `motion.md`: "may make them feel… physically uncomfortable").
- **Hover tilt or lift on the crop/livestock cards.** Rejected (Function): the cards are not links; motion would fake an affordance.
- **Animating the comparison table rows or ticks one by one.** Rejected (Function): reading content; if the table survives X1, it should just appear.
- **Marquee of insurer logos.** Rejected (Purpose + honesty): the logos are placeholders, and constant motion is noise.
- **Nav link hover animations or underline slides.** Rejected (Frequency): hovered many times per visit; the instant colour change is right.
- **Animated scroll-jacking or pinned sections.** Rejected (Agency, HIG): takes scroll control from the user. The removed phone-story pin was the right call.

### 3.4 Things that must not animate

Body copy, prices and figures, the comparison data, form fields (when they arrive), focus rings, the skip link, the sticky header's position, anything keyboard-triggered, and anything that repeats endlessly after the first 3 seconds (Ken Burns, bob, any loop in M-O1).

---

## 4. Keep

- The hero line **"Insurance that sees the storm coming."** It is specific, ownable and short.
- **"Never the final word"** column and the FAQ "Who decides my claim? The insurer's adjuster, always." This honesty is the brand.
- The **Without/With copy** itself ("The news, and luck."). Keep the best two lines even if the table goes.
- **The cited protection-gap statistic** with its source link. It is real, not invented.
- **System font stack + big tight display type + 112px section rhythm.** It is already Apple-like; just raise body to 17px.
- **The swimlane idea** (who does what, adjuster decides). It is the clearest insurer explanation on the page; fix the colours, not the concept.
- `aria-*` on the menu button, the skip link, `scope` on table headers, the `.sr` caption, and the reduced-motion intent. Keep them and refine them.
- **Photo choices** (Bulacan paddy, carabao, IRRI flooded field) with proper credits. They are local and real.

---

## Appendix A: Deterministic scan

`impeccable detect --json index.html` → 11 findings (exit 2):
- `extreme-negative-tracking` ×8 (all h1/h2). Real at mobile sizes; the em magnitude is overstated because the clamp was resolved against 16px. See G8.
- `icon-tile-stack` ×2 (Crops, Livestock). Agrees with C2.
- `all-caps-body` ×1. Uppercase table header cells and eyebrows; borderline, since they are short labels. The uppercase `thead` at 15px is the case worth changing to sentence case.

The detector missed the bigger issues found by the manual review: the CTA self-link, invisible focus on dark sections, brand-yellow misuse, hairlines, the swimlane `align-self` bug and the duplicate storytelling.

## Appendix B: Contrast (computed)

| Pair | Ratio | Status |
|---|---|---|
| muted #44533F on white / mist / cream | 8.22 / 7.71 / 7.74 | Pass |
| green #557945 on white (eyebrows 14px, links) | 4.99 | Pass AA |
| green on #E3ECDF (step node icon) | 4.12 | Pass for 3:1 graphics |
| white on green #557945 (insurer lead 18-21px) | 4.99 | Pass |
| white on lanes #4C6D3E / #3F5C33 | 5.89 / 7.53 | Pass |
| ink on sun #FFCB3D (CTA) | 9.86 | Pass |
| cream on ink (footer) | 14.07 | Pass |
| track #EEF2EA on white | 1.13 | Fail as a meaningful graphic |
| ink focus ring on green #557945 | 2.99 | **Fail** (needs 3:1) |
| ink focus ring on hero scrim (~#1A2A16) | 1.01 | **Fail** |
| sun on white (if yellow were ever used for text or icons on white) | 1.51 | Never use |
