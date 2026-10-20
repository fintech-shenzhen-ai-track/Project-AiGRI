# AiGRI landing page: redesign implementation plan

Target file: `landing-preview/index.html` (one `<style>`, one `<script>` IIFE).
Inputs: `review/REVIEW.md`, `brand/logo/final/*.svg`, the owner's overrides.
Skill lenses used: impeccable (Persuade mode, refinement of the existing page, not a new visual world), emil-design-eng, animate (decision order), find-animation-opportunities (gate + rejections), apple-design (type, contrast, 44px targets, motion is optional), mobile-native (tap highlight, hover gating, press feedback, no `vh`).

Execution order: **PKG-0 runs alone first.** PKG-1 to PKG-4 then run **in parallel**. Then you run section 5 (integration checklist).

---

## 1. Goals and final section order

### Goals
1. **Tell the story once.** Today the five-step story appears four times. After this pass, each section says one thing.
2. **Fix the critical bugs.** Get covered buttons that link to themselves, focus rings you cannot see on dark sections, and content that stays hidden without JS.
3. **Follow the brand rules exactly.** Use the Field Watch logo inline. Sun yellow appears only on Get covered buttons and the logo sun. No hairlines, solid surfaces, white or neutral backgrounds, no muddy green tints.
4. **Make motion crafted.** Every animation has a stated purpose and exact values, uses transform and opacity only, can be interrupted, has no decorative infinite loops, and has a gentler reduced-motion version.
5. **Feel native at 390px.** 44px targets, no sticky hover, no tap flash, press feedback, nothing cramped.
6. **Stay ready for the canvas artboard.** No `vh`, `svh` or `dvh`. All JS stays inside the one IIFE. No libraries. No new images.

### Final section order (what each one says)

| # | Section (id) | Background | One idea |
|---|---|---|---|
| — | Header | `#FFFFFF` solid | Logo, nav, Get covered |
| 1 | Hero (`#top`) | Photo | "Insurance that sees the storm coming." |
| 2 | Protection gap (`#gap`) | Cream `#FFF8E1` | Under 5% of the losses were insured (cited) |
| 3 | How it works (`#how`) | White | Five steps, one timeline (the only telling of the flow) |
| 4 | What you can insure (`#cover`) | White, cards `#F5F5F7` | Crops, livestock, or both |
| 5 | Satellite checks (`#proof`) | `#F5F5F7` | Video placeholder: radar sees the flood, your photos back it up |
| 6 | For insurers (`#insurers`) | Green `#557945` | Your adjuster decides; the swimlane shows the hand-off |
| 7 | FAQ (`#faq`) | White | Good to know |
| 8 | CTA (`#get-covered`) | Cream `#FFF8E1` | Know where you stand before the next storm |
| — | Footer | Ink `#1F2A1B` | Reversed logo, links, collapsed photo credits |

**Removed:** "5. WORKED EXAMPLE" (it repeats How it works and has no real data; its one good line, "You confirm, the adjuster decides, you get paid", is already in How it works steps 4 and 5) and "7. WITHOUT VS WITH" (the third telling of the same five steps; it does not work on mobile either).
**Moved:** the protection gap now comes before How it works, so the page runs stakes → solution → what → proof → insurers.

### Decisions on the review findings

| Finding | Decision | Reason |
|---|---|---|
| G1 CTA self-link | **Adopt** | Critical. Every Get covered points to `/signup` (placeholder). The hero `id` is removed. |
| G2 Focus ring on dark | **Adopt** | Critical. A `--focus` token flips to white inside `.hero`, `.ins`, `.ftr`. |
| G3 Hidden without JS | **Adopt** | Critical. The hidden state only applies under `html.js`, which the IIFE adds first. |
| G4 Yellow misuse | **Adopt** | Owner rule. Each use is fixed in its own package. |
| G5 Hairlines | **Adopt** | Owner rule. |
| G6 Translucent header | **Adopt** | Solid white, with a shadow on scroll. |
| G7 Type too small | **Adopt** | Body text 17px. Labels 15px minimum. 13px only for caps eyebrows and labels. |
| G8 px tracking | **Adopt** | em tracking. |
| G9 Muddy tints | **Adopt** | `#F5F5F7` neutral. One green only. |
| G10 Invalid `<ol>` children | **Adopt** | Track and fill move into a wrapper div. |
| G11 Dead code | **Adopt** | Each package deletes the dead code in its own region. |
| G12 Favicon/meta | **Merge** | Meta description and theme-color only. A favicon would need a new file next to the page (no new files), so skip it. |
| H1 Logo | **Adopt, changed** | Inline SVG paths (owner), not `<img>`. |
| H2 Scrollspy | **Adopt** | Cheap, aids orientation, no animation. |
| H3 44px header CTA | **Adopt** | |
| H4 Menu Esc/outside/morph | **Adopt** | |
| He1 Muddy scrim | **Adopt** | Bottom-weighted scrim. |
| He2 Too many things | **Adopt** | Shorter subhead, text-link secondary, chips and cue removed. |
| He3 Trust line hidden on mobile | **Adopt** | One plain line, visible at every width. |
| He4 LCP h1 fade | **Adopt** | The h1 animates transform only. |
| He5 Mobile buttons | **Adopt** | |
| He6 "real risk" | **Adopt** | "your risk" / "predicted risk". |
| T1 "act on two" | **Adopt** | New lead copy. |
| T2 Track contrast | **Adopt** | `#E3E3E0` (1.29:1, a hint only; the fill and nodes carry the state). |
| T3 Step 1 lit at load | **Adopt** | |
| T4 Mobile motion | **Adopt** | Vertical fill. |
| T5 Long descriptions | **Adopt** | 8 words or fewer. |
| P1 Bar for "under 5%" | **Adopt** | Derived from cited numbers (187 / 4130 = 4.53%). |
| P2 Alignment | **Adopt** | Stacked layout. |
| P3 Cream border | **Adopt** | Border removed. Cream is kept (brand colour, two bands only). |
| P4 Verify source | **Adopt as checklist item** | Agents cannot verify it. You check it (section 5). |
| C1 Spec-sheet cards | **Adopt** | One line per card. |
| C2 Icon tiles | **Adopt** | Removed. |
| C3 Reused hero.jpg | **Reject** | No new image files allowed. Use a tight crop on the panicles instead. |
| C4 960px cards | **Adopt** | Full width. |
| C5 Padding mismatch | **Adopt** | `--p` variable. |
| C6 180px images | **Adopt** | 260px desktop / 200px mobile. |
| W1–W3 Worked example | **Adopt (cut)** | Repetition. |
| S1 Dead play button | **Merge with owner override** | Stays a **video placeholder** (not an illustration). The play button now works and shows a "Video coming soon" state, plus a one-shot scan line. The review's radar/flood-mask scene (M-O1) is **rejected** per owner. |
| S2 Yellow play button | **Adopt** | White, ink glyph, gated hover, press feedback. |
| S3 Muddy video overlay | **Adopt** | 0.28 overlay, ink pills for text. |
| S4 "proof" naming | **Adopt** | Nav label "Satellite checks". The h2 no longer says "proof". |
| S5 Small columns | **Adopt** | |
| X1–X3 Table | **Adopt (cut)** | Repetition plus a broken mobile layout. |
| I1 Ragged mobile cards | **Adopt** | |
| I2 Three greens | **Adopt** | No lane fills. |
| I3 Yellow line/decide | **Adopt** | White line, ink Decide card. |
| I4 Geometry | **Adopt** | Margin-top removed. Stacks at 1000px or narrower. |
| I5 Two-idea headline | **Adopt** | |
| I6 Logo tiles look disabled | **Merge** | White tiles with muted bracket text. Kept, since the owner accepts placeholders. |
| F1 FAQ snaps | **Adopt** | WAAPI height + opacity (works in Safari too). |
| F2 Misaligned column | **Adopt** | |
| F3 Hairlines | **Adopt** | |
| F4 Missing questions | **Merge** | Add "Do I need a smartphone?" only, which keeps 7 items. |
| A1–A3 CTA | **Adopt** | Plus the peak-end sun-rise moment (M-O4 moved here). |
| Fo1–Fo3 Footer | **Adopt** | |
| M1–M8 Mobile | **Adopt**, except M6 | M6: **Reject `svh`.** The owner bans viewport-height units, so use px `min-height`. |
| M-O1 Satellite scene | **Reject** | Owner override. It stays a video placeholder. |
| M-O2 Fill + node pop | **Adopt** | |
| M-O3 Gap bar | **Adopt** | |
| M-O4 Logo sun | **Adopt, moved** | Only at the CTA (peak-end). The header logo stays static, because navigation chrome should not perform. |
| M-O5 FAQ | **Adopt (JS variant)** | |
| M-O6 Menu | **Adopt** | |
| M-O7 Swimlane draw | **Adopt, changed** | stroke-dashoffset is not transform/opacity, so a scaleX "wipe" cover reveals the line instead. |
| Header shadow | **Adopt** | |
| Ken Burns infinite | **Change** | One-shot settle, no loop. |
| Scroll cue bob | **Reject (remove cue)** | It is noise and the hero no longer fills the screen. |

---

## 2. Shared tokens and conventions (all packages)

### Rules every package follows
- **Colours:** use only the tokens below. Yellow (`--sun`) appears **only** on `.btn-y` (Get covered) and the logo sun / i-dot. No `border`, `outline` or `inset box-shadow` rings for decoration. Separate things with space and solid fills.
- **Type floors:** body 17px. Secondary text and labels 15px minimum. 13px only for UPPERCASE eyebrows and labels. Tracking in `em`.
- **Units:** no `vh/svh/dvh/lvh`. Use px, `clamp()` (with `vw` allowed), %, em.
- **Motion:** `transform` and `opacity` only (the FAQ accordion `height` is the one sanctioned exception). Use the motion tokens, never `ease-in` and never `scale(0)`. Interactive state uses **transitions** (so it can be interrupted). One-shot entrances may use keyframes. **No infinite animations anywhere.** Every animation has a `prefers-reduced-motion` answer (gentler, not zero).
- **Hover:** every `:hover` rule sits inside `@media (hover:hover) and (pointer:fine){…}`. Every pressable thing has an `:active` state.
- **Stagger:** set `style="--i:N"` (N = 0..4) on the element itself; `.reveal` reads it. 4 steps maximum, 60ms each.
- **JS:** add code only inside your own labelled function block (see markers). Never add a second `<script>`. Read the viewport with `innerHeight` / `matchMedia`, never CSS `vh`. Scroll listeners: `{passive:true}` + one `requestAnimationFrame` per frame.
- **Ownership:** edit only the regions your package owns (listed by HTML comment, CSS comment heading or selector, and JS lines). If you need something from another region, use the token or class it promises; do not edit its code.

### Concurrency protocol for parallel agents (PKG-1..4)
1. **Re-read the file right before every Edit.** Other agents are editing it.
2. Keep each `old_string` small and inside your own region (your own HTML comment, your own selectors, your own `/* PKG-x */` block).
3. **CSS insertion:** create your block once, with a single Edit whose `old_string` is exactly `/* responsive */` and whose `new_string` is your block followed by `/* responsive */`:
   ```
   /* PKG-x: <name> */
   ...your rules, including your own @media and reduced-motion rules...
   /* end PKG-x */

   /* responsive */
   ```
   After that, anchor later edits on your own `/* PKG-x: ... */` and `/* end PKG-x */` lines.
4. **JS insertion:** same pattern, with `old_string` exactly `})();` and `new_string` set to:
   ```
     // ==== PKG-x: <name> ====
     (function pkgX(){ ... })();
     // ==== end PKG-x ====
   })();
   ```
   Each package wraps its code in its own inner IIFE, so a thrown error stays inside it. Exception: PKG-1's `js` class and reveal engine, which edit the top of the IIFE (see PKG-1).
5. If an Edit fails because the file changed or the string is not unique, re-read and retry. Never use Write to rewrite the whole file.
6. **Old responsive and keyframe rules:** the existing `@media` blocks under `/* responsive */` and the `@keyframes` lines hold rules for several packages. Delete **only the lines for your own selectors** (listed in your package), each line on its own. Leave any `@media (...){` wrapper that becomes empty; the integrator removes those.

---

## PKG-0: tokens and global base (run FIRST, alone)

**Owns:** CSS lines 8–30 (`:root`, base rules, `/* buttons */`), and these lines of `/* section scaffolding */`: `.sec`, `.sec-mist`, `.eyebrow`, `.h2`, `.lead`, `.band`, `.band img`, `.band figcaption`. Also `/* reveal */` (lines 56–58), the two global lines in the first `@media (max-width:880px)` (`.wrap{padding:0 20px}` and `.sec{padding:80px 0}`), and lines 262–264 of the reduced-motion block (`html{scroll-behavior:auto}`, the `*,*::before,*::after{…!important}` rule, and `.reveal{…}`). Not owned, do not touch: `.card`, `.card-img` (PKG-3), and `.flood` on line 265 (PKG-3 deletes it).

Exception to "top of style only": the global reduced-motion and gutter rules at the bottom are global base rules, so PKG-0 **moves** them to the top and deletes them at the bottom. No HTML or JS changes.

### Replace lines 8–30 with:
```css
:root{
  /* colour */
  --ink:#1F2A1B; --muted:#44533F; --green:#557945; --sun:#FFCB3D; --sun-press:#F2B91F;
  --cream:#FFF8E1; --white:#FFFFFF; --surface-2:#F5F5F7; --surface-3:#EDEDF0; --track:#E3E3E0;
  --focus:#1F2A1B;
  /* legacy aliases, kept until every package migrates; integrator deletes */
  --mist:#F5F5F7; --tint:#F5F5F7; --line:#E3E3E0; --sun-hover:#F2B91F;
  /* type */
  --font:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Segoe UI",system-ui,sans-serif;
  --fs-h1:clamp(44px,7.2vw,96px); --fs-h2:clamp(34px,4.8vw,56px); --fs-h3:clamp(22px,2.2vw,26px);
  --fs-lead:clamp(19px,1.8vw,22px); --fs-body:17px; --fs-small:15px; --fs-label:13px;
  --tr-h1:-0.035em; --tr-h2:-0.028em; --tr-h3:-0.015em; --tr-label:0.08em;
  /* space */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px; --s7:48px; --s8:64px; --s9:96px;
  --sec-y:clamp(88px,11vw,136px); --gutter:32px; --wrap:1160px;
  /* shape */
  --r-lg:28px; --r-md:20px; --r-sm:14px; --r-pill:999px;
  --shadow-float:0 8px 24px rgba(31,42,27,.10);
  /* motion */
  --ease-out:cubic-bezier(0.23,1,0.32,1);
  --ease-in-out:cubic-bezier(0.77,0,0.175,1);
  --ease-drawer:cubic-bezier(0.32,0.72,0,1);
  --dur-press:160ms; --dur-fast:200ms; --dur-ui:240ms; --dur-reveal:600ms; --dur-explain:1600ms;
  --stagger:60ms; --rise:16px;
}
@media (max-width:880px){ :root{ --gutter:20px; } }

*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:80px;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--font);font-size:var(--fs-body);line-height:1.5;color:var(--ink);background:var(--white);-webkit-font-smoothing:antialiased}
a{color:var(--green)}
a,button,summary{touch-action:manipulation}
img{max-width:100%;display:block}
:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
.hero,.ins,.ftr{--focus:#FFFFFF}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 var(--gutter)}
.skip{position:absolute;left:-9999px;top:8px;background:var(--white);color:var(--ink);padding:12px 16px;border-radius:var(--r-sm);z-index:100}
.skip:focus{left:16px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
@media (hover:hover) and (pointer:fine){ a:hover{color:var(--ink)} }

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 26px;border-radius:var(--r-pill);font:600 17px/1 var(--font);text-decoration:none;cursor:pointer;border:0;
  -webkit-user-select:none;user-select:none;
  transition:background-color var(--dur-fast) ease,color var(--dur-fast) ease,transform var(--dur-press) var(--ease-out)}
.btn:active{transform:scale(.97)}
.btn-lg{min-height:56px;padding:0 32px;font-size:18px}
.btn-y{background:var(--sun);color:var(--ink)}
.btn-y:active{background:var(--sun-press)}
.btn-w{background:var(--white);color:var(--ink)}
.btn-w:active{background:var(--cream)}
@media (hover:hover) and (pointer:fine){
  .btn-y:hover{background:var(--sun-press);color:var(--ink)}
  .btn-w:hover{background:var(--cream);color:var(--ink)}
}

/* global reduced motion: gentler, not zero. Packages add their own specifics. */
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .btn:active{transform:none}
}
```
Notes: `.btn-ow` is removed on purpose (PKG-2 swaps the hero's secondary button for a text link). The old focus rule's `border-radius:6px` is removed: it changed the radius of pill buttons on focus. The old blunt `*{animation:none!important;transition:none!important}` is **not** replaced with another global kill switch. It would also kill the opacity fades that reduced motion should keep. Each package ships its own reduced-motion rules (spelled out below), and the integrator checks them.

### Section scaffolding (replace `.sec` … `.lead` and delete the three `.band` lines)
```css
.sec{padding:var(--sec-y) 0}
.sec-alt{background:var(--surface-2)}
.eyebrow{margin:0 0 14px;font-size:var(--fs-label);font-weight:600;letter-spacing:var(--tr-label);text-transform:uppercase;color:var(--green)}
.h2{margin:0 0 20px;font-size:var(--fs-h2);line-height:1.05;font-weight:700;letter-spacing:var(--tr-h2);max-width:860px;text-wrap:balance}
.lead{margin:0 0 56px;font-size:var(--fs-lead);line-height:1.45;color:var(--muted);max-width:640px;text-wrap:pretty}
```
(Delete `.sec-mist`. PKG-3 and PKG-4 stop using it.)

### Reveal (replace lines 56–58)
```css
/* reveal: hidden state only when JS is running (html.js is set by PKG-1) */
.js .reveal{opacity:0;transform:translateY(var(--rise));
  transition:opacity var(--dur-reveal) var(--ease-out),transform var(--dur-reveal) var(--ease-out);
  transition-delay:calc(var(--i,0) * var(--stagger))}
.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .js .reveal{transform:none;transition:opacity 300ms ease;transition-delay:0ms}
}
```
- **Gate:** marketing page, rare. **Purpose:** pacing / preventing a jarring change. **Duration:** 600ms (marketing allows longer than UI). **Curve:** `--ease-out` on both properties. **Distance:** 16px. **Interruption:** one-shot (the observer unobserves). **Reduced motion:** opacity only, 300ms.

### Bottom of the file
- In the first `@media (max-width:880px)`, delete `.wrap{padding:0 20px}` and `.sec{padding:80px 0}` (the token and clamp replace them).
- In `@media (prefers-reduced-motion:reduce)`, delete `html{scroll-behavior:auto}`, the `*,*::before,*::after{animation:none!important;transition:none!important}` line and `.reveal{opacity:1;transform:none}`. Leave `.flood{opacity:1}` (PKG-3 deletes it).
- Do **not** touch the `/* responsive */` comment; it is the insertion marker.

### Acceptance
- `:root` holds every token above. `--leaf` is gone.
- The page still renders (other packages haven't run yet, so visuals may be mid-state).
- `grep -n "vh" index.html` finds no new `vh` from PKG-0 (the hero `vh` is PKG-2's job).
- No `transition:all` and no ungated `:hover` in PKG-0's lines.

---

## PKG-1: shell (head, header, mobile menu, CTA, footer, global JS)

**Owns**
- HTML: the `<head>` meta tags (lines 4–6), skip link (270), `<header>` (272–292), `<!-- 10. CTA -->` section (480–487), `<footer>` (490–498).
- CSS: `/* header */` (32–42) and `/* cta + footer */` (199–207). Old responsive lines: `.nav,.login{display:none}`, `.menu-btn{display:inline-flex}`, the two `.nav.open…` lines (880 block), and `.hdr-cta .btn{padding:0 14px}` (560 block).
- JS: lines 502–513 (mobile menu + reveal), plus the first lines of the IIFE.
- Insertion: `/* PKG-1: shell */` CSS block, `// ==== PKG-1: shell ====` JS block.

### Head
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="AiGRI ranks farm insurance for your risk, warns you before a storm, and files your claim with satellite and photo evidence.">
<meta name="theme-color" content="#FFFFFF">
<title>AiGRI: insurance that sees the storm coming</title>
```

### Header markup (replace 272–292)
- The logo link wraps the **inline colour horizontal logo** (paths copied verbatim from `brand/logo/final/aigri-horizontal-color.svg`):
```html
<a class="logo" href="#top" aria-label="AiGRI, back to top">
  <svg class="logo-svg" viewBox="0 0 756 256" aria-hidden="true" focusable="false">
    <path fill="#557945" d="M72 76 H134.6 A64 64 0 0 0 180.1 120 H72 A16 16 0 0 1 56 104 V92 A16 16 0 0 1 72 76 Z"/>
    <rect fill="#557945" x="36" y="136" width="204" height="44" rx="16"/>
    <rect fill="#557945" x="16" y="196" width="224" height="44" rx="16"/>
    <circle fill="#FFCB3D" cx="196" cy="58" r="46"/>
    <g transform="translate(304 0)">
      <path fill="#1F2A1B" fill-rule="evenodd" d="M15.85 188 L48 68 H72 L104.15 188 H81.37 L73.87 160 H46.13 L38.63 188 Z M60 108.3 L68.5 140 H51.5 Z"/>
      <rect fill="#1F2A1B" x="130" y="116" width="22" height="72"/>
      <path fill="#557945" d="M124.27 85 A17 17 0 1 1 157.73 85 Z"/>
      <path fill="#557945" d="M155.4 91 A17 17 0 0 1 126.6 91 Z"/>
      <path fill="#1F2A1B" d="M272.5 88.1 A62 62 0 1 0 287 128 L265 128 A40 40 0 1 1 255.6 102.3 Z"/>
      <rect fill="#1F2A1B" x="243" y="117" width="44" height="22"/>
      <path fill="#1F2A1B" fill-rule="evenodd" d="M309 68 H357.5 A37.5 37.5 0 0 1 357.5 143 H331 V188 H309 Z M331 90 H357.5 A15.5 15.5 0 0 1 357.5 121 H331 Z"/>
      <path fill="#1F2A1B" d="M348 143 H372 L397.98 188 H373.98 Z"/>
      <rect fill="#1F2A1B" x="419" y="68" width="22" height="120"/>
    </g>
  </svg>
</a>
```
  Size: `height:41px; width:auto` gives about 121px wide, which meets the guide's 120px minimum for the horizontal lockup. The header logo is **static**, with no animation.
- Nav: `<nav class="nav" id="nav" aria-label="Main">` with links, each with `style="--i:N"` (0–5): How it works `#how`, What you can insure `#cover`, **Satellite checks** `#proof`, For insurers `#insurers`, FAQ `#faq`, plus `<a class="nav-login" href="/login">Log in</a>` (shown only inside the mobile menu).
- `.hdr-cta`: `<a class="login" href="/login">Log in</a>`, `<a class="btn btn-y" href="/signup">Get covered</a>`, menu button:
```html
<button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Open menu">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F2A1B" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <path class="mb-top" d="M4 7h16"/><path class="mb-mid" d="M4 12h16"/><path class="mb-bot" d="M4 17h16"/>
  </svg>
</button>
```

### Header CSS (replace `/* header */` block)
```css
/* header */
.hdr{position:sticky;top:0;z-index:50;background:var(--white)}
.hdr::after{content:"";position:absolute;left:0;right:0;bottom:0;height:12px;transform:translateY(100%);pointer-events:none;
  box-shadow:inset 0 10px 10px -10px rgba(31,42,27,.14);opacity:0;transition:opacity var(--dur-fast) ease}
.hdr.scrolled::after{opacity:1}
.hdr .wrap{display:flex;align-items:center;gap:20px;min-height:68px}
.logo{display:flex;align-items:center;text-decoration:none;border-radius:8px}
.logo-svg{display:block;height:41px;width:auto}
.nav{display:flex;gap:4px;flex-grow:1;margin-left:20px}
.nav a,.login{color:var(--ink);text-decoration:none;font-weight:500;font-size:15px;padding:12px 12px;border-radius:12px;transition:background-color var(--dur-fast) ease}
.nav a[aria-current="true"]{background:var(--surface-2)}
.nav-login{display:none}
.hdr-cta{display:flex;gap:8px;align-items:center}
.hdr-cta .btn{min-height:44px;padding:0 20px;font-size:15px}
.menu-btn{display:none;width:44px;height:44px;border:0;background:transparent;border-radius:12px;cursor:pointer;align-items:center;justify-content:center;transition:background-color var(--dur-fast) ease}
.menu-btn:active{background:var(--surface-3)}
.menu-btn path{transform-box:fill-box;transform-origin:center;transition:transform var(--dur-fast) var(--ease-out),opacity var(--dur-fast) var(--ease-out)}
.menu-btn[aria-expanded="true"] .mb-top{transform:translateY(5px) rotate(45deg)}
.menu-btn[aria-expanded="true"] .mb-mid{opacity:0}
.menu-btn[aria-expanded="true"] .mb-bot{transform:translateY(-5px) rotate(-45deg)}
@media (hover:hover) and (pointer:fine){
  .nav a:hover,.login:hover{background:var(--surface-2)}
  .menu-btn:hover{background:var(--surface-2)}
}
```
Delete the old `.hdr` backdrop-filter and border. The shadow is a soft shadow (not a hairline) that only appears once the page has scrolled.

### Mobile menu (in the PKG-1 block, `@media (max-width:880px)`)
```css
@media (max-width:880px){
  .login{display:none}
  .menu-btn{display:inline-flex}
  .nav{position:absolute;left:0;right:0;top:100%;margin:0;padding:8px var(--gutter) 20px;flex-direction:column;gap:2px;
    background:var(--white);border-radius:0 0 var(--r-md) var(--r-md);box-shadow:var(--shadow-float);
    visibility:hidden;opacity:0;transform:translateY(-8px);
    transition:opacity 160ms var(--ease-out),transform 160ms var(--ease-out),visibility 0s linear 160ms}
  .nav.open{visibility:visible;opacity:1;transform:none;
    transition:opacity 220ms var(--ease-drawer),transform 220ms var(--ease-drawer),visibility 0s linear 0s}
  .nav a{padding:14px 8px;font-size:17px;min-height:48px;opacity:0;transform:translateY(-4px);
    transition:opacity 160ms var(--ease-out),transform 160ms var(--ease-out)}
  .nav.open a{opacity:1;transform:none;transition-duration:220ms;transition-delay:calc(var(--i,0) * 30ms)}
  .nav-login{display:block}
  .hdr-cta .btn{padding:0 16px}
}
@media (prefers-reduced-motion:reduce){
  .nav,.nav.open,.nav a,.nav.open a{transform:none!important;transition-delay:0ms!important}
  .menu-btn path{transition:opacity var(--dur-fast) ease}
}
```
- **Gate:** occasional. **Purpose:** spatial consistency (the panel drops from the bar) and state (the icon morphs to an X). **Enter:** 220ms `--ease-drawer`, links staggered 30ms. **Exit:** 160ms `--ease-out`, faster than the enter, with no stagger. **Interruption:** transitions retarget. **Reduced motion:** opacity only, and the icon swaps opacity with no rotation. `visibility` keeps the closed menu out of the tab order.

### CTA section (replace 480–487)
```html
<!-- 10. CTA -->
<section class="cta" id="get-covered">
  <div class="wrap">
    <svg class="cta-mark reveal" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <path class="cm-row" style="--r:0" fill="#557945" d="M72 76 H134.6 A64 64 0 0 0 180.1 120 H72 A16 16 0 0 1 56 104 V92 A16 16 0 0 1 72 76 Z"/>
      <rect class="cm-row" style="--r:1" fill="#557945" x="36" y="136" width="204" height="44" rx="16"/>
      <rect class="cm-row" style="--r:2" fill="#557945" x="16" y="196" width="224" height="44" rx="16"/>
      <circle class="cm-sun" fill="#FFCB3D" cx="196" cy="58" r="46"/>
    </svg>
    <h2 class="h2 reveal" style="--i:1">Know where you stand before the next storm.</h2>
    <p class="lead reveal" style="--i:2">Set up your farm and see policies ranked for your risk.</p>
    <div class="reveal" style="--i:3"><a class="btn btn-y btn-lg" href="/signup">Get covered</a></div>
    <p class="cta-note reveal" style="--i:4">You confirm every claim before it is sent.</p>
  </div>
</section>
```
CSS (replace `.cta` line):
```css
.cta{background:var(--cream);text-align:center;padding:var(--sec-y) 0}
.cta .h2,.cta .lead{margin-left:auto;margin-right:auto}
.cta .lead{margin-bottom:36px}
.cta-mark{display:block;width:72px;height:72px;margin:0 auto 28px;overflow:visible}
.cta-note{margin:20px 0 0;font-size:var(--fs-small);color:var(--muted)}
/* sun-rise: once, when the mark is revealed */
.js .cta-mark .cm-row{opacity:0;transform:translateY(8px);transition:opacity 500ms var(--ease-out),transform 500ms var(--ease-out);transition-delay:calc(var(--r) * 60ms)}
.js .cta-mark .cm-sun{transform-box:fill-box;transform-origin:center;opacity:0;transform:translateY(40%) scale(.92);
  transition:opacity 900ms var(--ease-out) 240ms,transform 900ms var(--ease-out) 240ms}
.js .cta-mark.in .cm-row,.js .cta-mark.in .cm-sun{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .js .cta-mark .cm-row,.js .cta-mark .cm-sun{transform:none;transition:opacity 300ms ease}
}
```
- **Gate:** rare, once per visit. **Purpose:** delight at the peak-end moment (the brand's "sun rising over the field"). The final frame equals the official symbol, so the logo is not altered. `.cta-mark` also has `.reveal`, so the whole SVG fades and rises first, then the rows and sun play inside it.

### Footer (replace 490–498)
- Logo: `<a class="logo ftr-logo" href="#top" aria-label="AiGRI, back to top">` + inline **reversed** SVG (paths verbatim from `aigri-horizontal-reversed.svg`: white rows and letters, `#FFCB3D` sun and i-dot, which is the logo sun returning and so allowed) with `class="logo-svg"`, height 44px (about 130px wide). No animation.
- Links: Log in `/login`, For insurers `#insurers`, FAQ `#faq`, Privacy `[placeholder]`, Contact `[placeholder]`.
- Keep `<details class="credits">` **unchanged in text** (licences need it). Summary text "Photo credits".

CSS (replace `.ftr` … `.ftr-links`):
```css
.ftr{background:var(--ink);color:var(--cream);padding:72px 0 48px}
.ftr a{color:var(--cream)}
.ftr-logo .logo-svg{height:44px}
.ftr-top{display:flex;gap:24px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:32px}
.ftr-links{display:flex;gap:8px 24px;flex-wrap:wrap;font-size:var(--fs-small)}
.ftr-links a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none}
.credits{font-size:var(--fs-small);color:var(--cream)}
.credits summary{cursor:pointer;width:max-content;min-height:44px;display:flex;align-items:center}
.credits p{margin:8px 0 0;max-width:760px}
@media (hover:hover) and (pointer:fine){ .ftr-links a:hover{text-decoration:underline} }
```

### JS (PKG-1 owns lines 502–513 and the top of the IIFE)
Replace lines 502–513 with this, as the **first code inside the IIFE**:
```js
  // ==== PKG-1: global (js class + reveal engine) — keep first ====
  document.documentElement.classList.add('js');
  (function reveal(){
    var els=[].slice.call(document.querySelectorAll('.reveal'));
    if(!('IntersectionObserver' in window)){ els.forEach(function(el){el.classList.add('in');}); return; }
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} });
    },{threshold:0.15,rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el);});
  })();
  // ==== end PKG-1 global ====
```
Then add the `// ==== PKG-1: shell ====` block before `})();` (per protocol) with:
1. **Menu**: toggle on click (`open` class, `aria-expanded`, `aria-label` Open/Close menu). Close on: a link click inside the nav; `Escape` (then `btn.focus()`); `pointerdown` outside both `nav` and `btn`; `matchMedia('(min-width:881px)')` change. Close = remove `open` and set `aria-expanded="false"`. Do not move focus into the menu on open (disclosure pattern).
2. **Header shadow**: `var hdr=document.querySelector('.hdr')`. On scroll (passive, one rAF per frame), `hdr.classList.toggle('scrolled', scrollY>8)`. Run once on load.
3. **Scrollspy**: IntersectionObserver on `#how,#cover,#proof,#insurers,#faq` with `rootMargin:'-45% 0px -50% 0px'`. On intersect, clear `aria-current` on all `.nav a` and set `aria-current="true"` on the matching `href`. When `#top` or `#gap` intersects, clear all. No animation (seen tens of times, so state is instant).

### Acceptance (PKG-1)
- All Get covered links point to `/signup`. There is no `id="get-covered"` on any button; the id is on the CTA section only.
- Header: solid white, no border, shadow appears after 8px of scroll, logo 41px tall, focus ring visible.
- At 390px: menu opens and closes with the animation, Esc and outside tap close it, the icon morphs, links are 48px tall, Log in sits inside the menu, the header CTA is 44px tall.
- The closed menu cannot be reached with Tab.
- Footer: reversed logo is a link, links are 44px tall, credits are collapsed and readable, white focus ring on ink.
- With JS disabled (or the `js` class removed in DevTools), every `.reveal` element is fully visible.
- CTA sun rises once, and does not replay when scrolling back.

---

## PKG-2: hero, protection gap, How it works timeline

**Owns**
- HTML: `<!-- 1. HERO -->` (296–317), `<!-- 2. HOW IT WORKS: timeline -->` (319–332), `<!-- 3. PROTECTION GAP -->` (334–343). **Reorder:** move the Gap section so it sits directly after the Hero `</section>` and before How it works, and renumber the comments (`<!-- 2. PROTECTION GAP -->`, `<!-- 3. HOW IT WORKS: timeline -->`).
- CSS: `/* hero */` (60–70), `/* phone story */` (72–95, **delete whole block**, dead code), `/* how it works timeline */` (98–110), `/* gap */` (112–115), and the whole `@keyframes` group (209–217, **delete all 9 lines**: `kb`, `rise` and `bob` are replaced in PKG-2's block; the rest are dead).
- Old responsive lines: `.story`, `.phone-col`, `.phone`, `.progress,.note`, `.step`, `.hero{min-height:88vh}` (880 block 1); every line in 880 block 2 that starts with `.htl`, `.hstep`, `.hnode` (5 lines + the two `.hstep` lines); `.chips{display:none}` (560 block).
- JS: lines 515–534 (timeline variables, `onScroll` including the worked-example `tl` code, which is deleted, and its listeners).
- Insertion: `/* PKG-2: hero, gap, how */` and `// ==== PKG-2: how-it-works ====`.

### 2a. Hero
Markup:
```html
<section class="hero" id="top">
  <img src="hero.jpg" alt="A wide green rice paddy under a cloudy sky in Bulacan, Philippines" fetchpriority="high">
  <div class="scrim" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow hero-in" style="--d:0ms">For farmers and agri businesses</p>
    <h1 class="hero-h1">Insurance that sees the storm coming.</h1>
    <p class="sub hero-in" style="--d:120ms">Policies ranked for your risk. Alerts before the storm. Claims filed with satellite and photo proof.</p>
    <div class="hero-actions hero-in" style="--d:180ms">
      <a class="btn btn-y btn-lg" href="/signup">Get covered</a>
      <a class="hero-link" href="#how">See how it works<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></a>
    </div>
    <p class="hero-trust hero-in" style="--d:240ms">You confirm every claim. The insurer's adjuster decides.</p>
  </div>
</section>
```
Remove the inline `style="color:#fff"` on the eyebrow (handled in CSS), the three chips and the `.cue` link.

CSS (replace `/* hero */` block; keyframes go in the PKG-2 block):
```css
.hero{position:relative;overflow:hidden;min-height:760px;display:flex;align-items:flex-end;background:#1F3A1A;color:#fff}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 62%;
  animation:hero-settle 8000ms var(--ease-out) 1 both}
.hero .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,34,14,.20) 0%,rgba(18,34,14,.10) 35%,rgba(18,34,14,.78) 100%)}
.hero .wrap{position:relative;width:100%;padding-top:140px;padding-bottom:88px}
.hero .eyebrow{color:#fff}
.hero-h1{margin:0 0 24px;font-size:var(--fs-h1);line-height:.98;font-weight:700;letter-spacing:var(--tr-h1);max-width:900px;text-wrap:balance;
  animation:hero-lift 600ms var(--ease-out) 60ms both}
.hero .sub{margin:0 0 36px;font-size:clamp(19px,2vw,24px);line-height:1.4;max-width:600px}
.hero-actions{display:flex;gap:12px 24px;flex-wrap:wrap;align-items:center}
.hero-link{display:inline-flex;align-items:center;gap:6px;min-height:48px;padding:0 4px;color:#fff;font-weight:600;font-size:17px;text-decoration:none;border-radius:8px}
.hero-link svg{transition:transform var(--dur-fast) var(--ease-out)}
.hero-link:active{opacity:.7}
.hero-trust{margin:28px 0 0;font-size:var(--fs-small);color:#fff}
.hero-in{animation:hero-rise var(--dur-reveal) var(--ease-out) var(--d,0ms) both}
@keyframes hero-rise{from{opacity:0;transform:translateY(var(--rise))}to{opacity:1;transform:none}}
@keyframes hero-lift{from{transform:translateY(12px)}to{transform:none}}
@keyframes hero-settle{from{transform:scale(1.06)}to{transform:none}}
@media (hover:hover) and (pointer:fine){ .hero-link:hover{color:#fff} .hero-link:hover svg{transform:translateX(3px)} }
@media (max-width:880px){ .hero{min-height:640px} .hero .wrap{padding-top:112px;padding-bottom:48px} }
@media (max-width:560px){
  .hero-actions{flex-direction:column;align-items:stretch}
  .hero-actions .btn{width:100%}
  .hero-link{justify-content:center}
}
@media (prefers-reduced-motion:reduce){
  .hero img,.hero-h1{animation:none}
  .hero-in{animation:hero-fade 300ms ease var(--d,0ms) both}
  @keyframes hero-fade{from{opacity:0}to{opacity:1}}
}
```
Motion spec:

| Element | Purpose | Property | Duration / curve | Delay | Reduced |
|---|---|---|---|---|---|
| Image | Ambient "camera settles", **once** | scale 1.06 → 1 | 8000ms `--ease-out` (about 80% of the move happens in the first 2s, then it creeps and stops) | 0 | none |
| Eyebrow | Entrance | opacity + translateY 16 → 0 | 600ms `--ease-out` | 0 | fade 300ms |
| h1 (LCP) | Entrance; painted at first frame | translateY 12 → 0 only, opacity stays 1 | 600ms `--ease-out` | 60ms | none |
| Subhead | Entrance | opacity + Y | 600ms | 120ms | fade |
| Actions | Entrance | opacity + Y | 600ms | 180ms | fade |
| Trust line | Entrance | opacity + Y | 600ms | 240ms | fade |
| Link chevron | Hover feedback (gated) | translateX 0 → 3px | 200ms `--ease-out` | — | — |

Note: the hero animations are CSS keyframes on purpose. They are predetermined, load-time and run off the main thread, so the global reduced-motion rule ends them on their final frame. They do not depend on `.js`, so the hero shows without JS.

### 2b. Protection gap (now section 2)
```html
<!-- 2. PROTECTION GAP -->
<section class="gap" id="gap" aria-labelledby="gapTitle">
  <div class="wrap">
    <p class="gap-num reveal" id="gapTitle">PHP 4.13B</p>
    <p class="gap-text reveal" style="--i:1">of farm damage in the Philippines, 1 to 26 August 2026. Insurance covered PHP 187 million.</p>
    <div class="gap-bar reveal" style="--i:2" role="img" aria-label="Insured share: PHP 187 million of PHP 4.13 billion, under 5 percent">
      <div class="gap-track"><span class="gap-fill"></span></div>
      <div class="gap-labels" aria-hidden="true"><span class="gap-l-ins">Insured: PHP 187M</span><span>Damage: PHP 4.13B</span></div>
    </div>
    <p class="gap-src reveal" style="--i:3">More than 60% of the agriculture sector is uninsured. <a href="https://www.insurancebusinessmag.com/asia/news/catastrophe/most-philippine-farm-losses-fall-outside-the-insured-pool-589508.aspx">Source: Insurance Business Asia, [article date]</a></p>
  </div>
</section>
```
CSS (replace `/* gap */`):
```css
.gap{background:var(--cream);padding:clamp(80px,9vw,120px) 0}
.gap-num{margin:0;font-size:clamp(64px,11vw,144px);font-weight:700;letter-spacing:-0.04em;line-height:.95;color:var(--green)}
.gap-text{margin:16px 0 40px;max-width:720px;font-size:clamp(22px,2.4vw,30px);line-height:1.3;font-weight:600;letter-spacing:-0.012em;text-wrap:balance}
.gap-bar{max-width:880px}
.gap-track{position:relative;height:14px;border-radius:var(--r-pill);background:var(--ink);overflow:hidden}
.gap-fill{position:absolute;left:0;top:0;bottom:0;width:4.53%;min-width:10px;background:var(--green);transform-origin:left center;border-radius:var(--r-pill)}
.gap-labels{display:flex;justify-content:space-between;gap:16px;margin-top:12px;font-size:var(--fs-small);font-weight:600}
.gap-src{margin:32px 0 0;font-size:var(--fs-small);color:var(--muted);max-width:720px}
/* bar fill: plays after the bar block is revealed */
.js .gap-bar .gap-fill{transform:scaleX(0);transition:transform 900ms var(--ease-out) 300ms}
.js .gap-bar .gap-l-ins{opacity:0;transition:opacity 200ms ease 1100ms}
.js .gap-bar.in .gap-fill{transform:none}
.js .gap-bar.in .gap-l-ins{opacity:1}
@media (prefers-reduced-motion:reduce){
  .js .gap-bar .gap-fill{transform:none;opacity:0;transition:opacity 300ms ease}
  .js .gap-bar.in .gap-fill{opacity:1}
  .js .gap-bar .gap-l-ins{transition:opacity 300ms ease}
}
```
- Track is **ink** (the whole loss) and fill is **green** (the insured share). There is no white track: white on cream is 1.06:1 and would be invisible. The two labels carry the meaning, so it does not rely on colour alone.
- **Gate:** rare. **Purpose:** explanation (it makes "under 5%" visible). **Count-up of the number is rejected** (a cited disaster figure is something to read, not a spectacle).

### 2c. How it works (now section 3)
Markup:
```html
<!-- 3. HOW IT WORKS: timeline -->
<section class="sec" id="how">
  <div class="wrap">
    <div class="reveal">
      <p class="eyebrow">How it works</p>
      <h2 class="h2">From your first field to your payout.</h2>
      <p class="lead">AiGRI does the paperwork. You make the calls.</p>
    </div>
    <div class="htl-wrap" id="htl">
      <span class="htl-track" aria-hidden="true"></span><span class="htl-fill" id="htlFill" aria-hidden="true"></span>
      <ol class="htl">
        <li class="hstep">…node svg… <span class="hnum">Step 1</span><h3>Tell us what you farm</h3><p>Map fields, list crops, tag livestock.</p></li>
        <li class="hstep">… <span class="hnum">Step 2</span><h3>Compare ranked policies</h3><p>Ranked for your predicted risk, with reasons.</p></li>
        <li class="hstep">… <span class="hnum">Step 3</span><h3>Get warned early</h3><p>An alert with steps, before the storm.</p></li>
        <li class="hstep">… <span class="hnum">Step 4</span><h3>File with proof</h3><p>Satellite readings and photos. You confirm.</p></li>
        <li class="hstep last">… <span class="hnum">Step 5</span><h3>Get paid</h3><p>The adjuster decides. Approved payouts arrive automatically.</p></li>
      </ol>
    </div>
  </div>
</section>
```
Keep the existing five node SVGs exactly as they are.

CSS (replace `/* how it works timeline */`):
```css
.htl-wrap{position:relative}
.htl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:28px;position:relative}
.htl-track,.htl-fill{position:absolute;left:10%;top:34px;height:4px;border-radius:4px}
.htl-track{right:10%;background:var(--track)}
.htl-fill{width:80%;background:var(--green);transform-origin:left center;transform:scaleX(0)}
.hstep{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center}
.hnode{position:relative;z-index:1;width:72px;height:72px;border-radius:var(--r-pill);background:var(--surface-2);stroke:var(--muted);
  display:flex;align-items:center;justify-content:center;margin-bottom:18px;
  transition:background-color var(--dur-fast) ease,stroke var(--dur-fast) ease}
.hnode svg{stroke:inherit;transform:scale(.9);transition:transform var(--dur-ui) var(--ease-out)}
.hstep.on .hnode{background:var(--green);stroke:#fff}
.hstep.on .hnode svg{transform:none}
.hstep.last.on .hnode{background:var(--ink);stroke:#fff}
.hnum{font-size:var(--fs-label);font-weight:600;letter-spacing:var(--tr-label);text-transform:uppercase;color:var(--green)}
.hstep h3{margin:6px 0 8px;font-size:20px;letter-spacing:var(--tr-h3);line-height:1.2}
.hstep p{margin:0;font-size:var(--fs-small);color:var(--muted);max-width:200px}
@media (max-width:880px){
  .htl{grid-template-columns:minmax(0,1fr);gap:28px}
  .htl-track,.htl-fill{left:26px;right:auto;top:28px;bottom:28px;width:4px;height:auto}
  .htl-fill{transform-origin:center top;transform:scaleY(0)}
  .hstep{display:grid;grid-template-columns:56px 1fr;column-gap:18px;align-items:start;text-align:left}
  .hnode{width:56px;height:56px;margin:0;grid-row:1/4}
  .hstep h3{margin:2px 0 4px}
  .hstep p{max-width:none;font-size:var(--fs-body)}
}
/* no-JS: show the completed state */
html:not(.js) .htl-fill{transform:none}
html:not(.js) .hnode{background:var(--green);stroke:#fff}
html:not(.js) .hnode svg{transform:none}
html:not(.js) .hstep.last .hnode{background:var(--ink)}
@media (prefers-reduced-motion:reduce){ .hnode svg{transform:none;transition:none} }
```
Step 5 lights **ink**, not yellow.

JS (replace lines 515–534 with the PKG-2 block; delete the `tl`/`tlFill` code entirely):
```js
  // ==== PKG-2: how-it-works ====
  (function pkg2(){
    var wrap=document.getElementById('htl'), fill=document.getElementById('htlFill');
    if(!wrap||!fill) return;
    var steps=[].slice.call(wrap.querySelectorAll('.hstep'));
    var mq=matchMedia('(max-width:880px)'), ticking=false, near=true;
    function update(){
      var vh=innerHeight, r=wrap.getBoundingClientRect(), p;
      if(mq.matches){
        // vertical: fill reaches the point 60% down the viewport
        var top=r.top+28, len=Math.max(1,r.height-56);
        p=Math.min(1,Math.max(0,(vh*0.6-top)/len));
        fill.style.transform='scaleY('+p+')';
        steps.forEach(function(s){ var n=s.querySelector('.hnode').getBoundingClientRect();
          s.classList.toggle('on', n.top+n.height/2 <= vh*0.6); });
      }else{
        p=Math.min(1,Math.max(0,(vh*0.85-r.top)/(vh*0.5)));
        fill.style.transform='scaleX('+p+')';
        steps.forEach(function(s,k){ s.classList.toggle('on', p>=Math.max(0.02,k/4)); });
      }
    }
    function onScroll(){ if(!near||ticking) return; ticking=true; requestAnimationFrame(function(){ticking=false;update();}); }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ near=es[0].isIntersecting; if(near) update(); },{rootMargin:'200px 0px'}).observe(wrap);
    }
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',update);
    mq.addEventListener('change',update);
    update();
  })();
  // ==== end PKG-2 ====
```
- **Gate:** occasional, scroll-linked. **Purpose:** state indication (how far through the flow you are). **Fill:** `transform` set **directly on the fill element** (not a CSS variable on a parent), **with no transition** (scroll is the clock, so it can't lag). **Node:** background and stroke 200ms `ease`. **Icon:** scale .9 → 1, 240ms `--ease-out` (never from 0). It reverses symmetrically when scrolling up, and transitions retarget. **Reduced motion:** the fill stays scroll-bound (user-driven), only colour changes, no scale.

### Acceptance (PKG-2)
- Order in `<main>`: Hero, Gap, How. No `.chips`, `.cue`, `.rise*`, `.btn-ow` or `vh` remain in PKG-2 regions.
- The hero h1 is visible in the very first frame (opacity 1). The image animation ends after 8s and never loops.
- At 390px: hero buttons stack full-width with the primary first, the trust line is visible, and the h1 is not cramped (em tracking).
- Gap bar fills once on reveal. The labels read "Insured: PHP 187M" and "Damage: PHP 4.13B".
- Timeline: no step is lit at load above the fold. Steps light in order as you scroll and un-light when you scroll back. Mobile shows the vertical fill. `<ol>` contains only `<li>`.
- No JS: the timeline shows fully lit and the gap bar shows filled.
- The console shows no error about `tl` or `tlFill`.

---

## PKG-3: What you can insure, worked-example removal, Satellite video placeholder

**Owns**
- HTML: `<!-- 4. CROPS AND LIVESTOCK -->` (345–372), `<!-- 5. WORKED EXAMPLE -->` (374–390, **delete the whole section**), `<!-- 6. SATELLITE PROOF -->` (392–413).
- CSS: `.card` and `.card-img` lines (50–51), `/* two cards */` (117–123), `/* timeline */` (125–135, **delete whole block**), `/* satellite */` (137–152, including the dead `.cloud/.rain/.sat/.beam/.flood/.pulse` lines). Old responsive lines: `.three{grid-template-columns:minmax(0,1fr)}` (1000 block), `.two{…}` and `.card{padding:28px}` (880 block 1), `.flood{opacity:1}` (reduced-motion block).
- JS: new block only, `// ==== PKG-3: video placeholder ====`.
- Insertion: `/* PKG-3: cover + satellite */`.

### 3a. What you can insure
```html
<section class="sec" id="cover">
  <div class="wrap">
    <div class="reveal">
      <p class="eyebrow">What you can insure</p>
      <h2 class="h2">Crops, livestock, or both.</h2>
      <p class="lead">Set up only what you farm. Cover and payouts follow the policy you choose.</p>
    </div>
    <div class="two">
      <article class="card reveal" style="--i:0">
        <div class="card-media"><img class="card-img" src="hero.jpg" alt="Close view of rice plants in a paddy" style="object-position:50% 92%" loading="lazy"></div>
        <h3>Crops</h3>
        <p>Rice, corn and high-value crops. Proof from satellite readings and in-app photos.</p>
      </article>
      <article class="card reveal" style="--i:1">
        <div class="card-media"><img class="card-img" src="cattle.jpg" alt="A carabao grazing on a farm with coconut palms and hills behind" style="object-position:50% 55%" loading="lazy"></div>
        <h3>Livestock</h3>
        <p>Cattle, hogs and poultry. Proof from ear-tag photos taken in the app.</p>
      </article>
    </div>
  </div>
</section>
```
Icon tiles, `h4`s and spec text are removed. The crop image uses a tighter, lower crop so it reads differently from the hero.

CSS:
```css
.card{--p:28px;background:var(--surface-2);border-radius:24px;padding:var(--p);overflow:hidden}
.card-media{margin:calc(-1*var(--p)) calc(-1*var(--p)) 24px;height:260px;overflow:hidden}
.card-img{width:100%;height:100%;object-fit:cover}
.card h3{margin:0 0 8px;font-size:var(--fs-h3);letter-spacing:var(--tr-h3)}
.card p{margin:0;color:var(--muted);font-size:var(--fs-body);max-width:440px}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
/* image settles inside its frame as the card reveals */
.js .card.reveal .card-img{transform:scale(1.06);transition:transform 1200ms var(--ease-out)}
.js .card.reveal.in .card-img{transform:none}
@media (max-width:880px){ .two{grid-template-columns:minmax(0,1fr)} .card{--p:24px} .card-media{height:200px} }
@media (prefers-reduced-motion:reduce){ .js .card.reveal .card-img{transform:none;transition:none} }
```
- Cards reveal with a 60ms stagger (`--i` 0/1). The image does a one-shot 1.06 → 1 settle over 1200ms `--ease-out`. **Purpose:** pacing. **No hover lift** (the cards are not links, so a hover would fake an affordance).

### 3b. Delete the worked example
Remove lines 374–390 (`<!-- 5. WORKED EXAMPLE -->` and its `<section>`) and the whole `/* timeline */` CSS block. (PKG-2 removes the matching JS.)

### 3c. Satellite checks: a richer **video placeholder** (owner override: not an illustration)
```html
<!-- 6. SATELLITE CHECKS -->
<section class="sec sec-alt" id="proof">
  <div class="wrap">
    <div class="reveal">
      <p class="eyebrow">Satellite checks</p>
      <h2 class="h2">Seen from space. Backed by your photos.</h2>
      <p class="lead">After a storm, radar satellites check each of your fields, even through cloud. The readings go in your claim beside your photos.</p>
    </div>
    <figure class="video reveal" id="video" data-state="idle">
      <img src="flooded.jpg" alt="A rice field flooded after Typhoon Ketsana" loading="lazy">
      <div class="video-shade" aria-hidden="true"></div>
      <div class="video-scan" aria-hidden="true"><span></span></div>
      <p class="video-tag">[Video] How radar checks a flooded field</p>
      <button class="play" id="playBtn" type="button" aria-label="Play video: how radar checks a flooded field">
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#1F2A1B"/></svg>
      </button>
      <p class="video-soon" id="videoSoon" role="status" aria-live="polite"></p>
      <div class="video-bar" aria-hidden="true"><span class="vb-time">0:00 / 0:30</span><span class="vb-track"><span class="vb-fill"></span></span></div>
    </figure>
    <div class="three">
      <div class="reveal" style="--i:0"><h3>Radar sees through cloud</h3><p>Storm cloud hides fields from cameras. Radar still sees the water.</p></div>
      <div class="reveal" style="--i:1"><h3>Before and after, per field</h3><p>Each field gets a flood reading and a crop-change reading, with a confidence level.</p></div>
      <div class="reveal" style="--i:2"><h3>Never the final word</h3><p>Radar can miss flooding under dense crops. A no-flood reading never closes a claim. Your photos and the adjuster fill the gap.</p></div>
    </div>
  </div>
</section>
```
CSS (replace `/* satellite */`; delete `.cloud` … `.pulse`):
```css
.video{position:relative;margin:0;border-radius:var(--r-lg);overflow:hidden;background:#1F3A1A;aspect-ratio:16/9;color:#fff}
.video img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.video-shade{position:absolute;inset:0;background:rgba(18,34,14,.28)}
.video-scan{position:absolute;inset:0;pointer-events:none;opacity:0}
.video-scan span{position:absolute;top:0;bottom:0;left:0;width:2px;background:#fff}
.video-scan span::before{content:"";position:absolute;top:0;bottom:0;right:2px;width:96px;background:#fff;opacity:.12}
.video-tag{position:absolute;left:20px;top:20px;margin:0;padding:8px 14px;border-radius:var(--r-pill);background:var(--ink);font-size:var(--fs-small);font-weight:600}
.play{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:var(--r-pill);border:0;background:#fff;
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  transition:transform var(--dur-press) var(--ease-out),opacity var(--dur-press) var(--ease-out)}
.play svg{margin-left:4px}
.play:active{transform:scale(.96)}
.video-soon{position:absolute;left:50%;top:50%;margin:0;transform:translate(-50%,calc(-50% + 8px));opacity:0;pointer-events:none;
  padding:14px 22px;border-radius:var(--r-pill);background:var(--ink);font-size:17px;font-weight:600;white-space:nowrap;
  transition:opacity var(--dur-press) var(--ease-out),transform var(--dur-press) var(--ease-out)}
.video[data-state="soon"] .play{opacity:0;transform:scale(.92)}
.video[data-state="soon"] .video-soon{opacity:1;transform:translate(-50%,-50%);
  transition:opacity var(--dur-ui) var(--ease-out) 80ms,transform var(--dur-ui) var(--ease-out) 80ms}
.video-bar{position:absolute;left:20px;right:20px;bottom:18px;display:flex;align-items:center;gap:14px;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.vb-track{position:relative;flex:1;height:4px;border-radius:4px;background:#fff;opacity:.4}
.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:36px;margin-top:48px}
.three h3{margin:0 0 8px;font-size:var(--fs-h3);letter-spacing:var(--tr-h3)}
.three p{margin:0;color:var(--muted);font-size:var(--fs-body)}
@media (hover:hover) and (pointer:fine){ .play:hover{transform:scale(1.04)} }
@media (max-width:1000px){ .three{grid-template-columns:minmax(0,1fr);gap:28px} }
@media (max-width:560px){
  .video{aspect-ratio:4/5}
  .video-tag{left:14px;top:14px;right:14px;width:max-content;max-width:calc(100% - 28px)}
  .play{width:72px;height:72px;margin:-36px 0 0 -36px}
  .video-soon{white-space:normal;width:max-content;max-width:calc(100% - 40px);text-align:center}
}
@media (prefers-reduced-motion:reduce){
  .play,.play:active,.video[data-state="soon"] .play{transform:none}
  .video-soon,.video[data-state="soon"] .video-soon{transform:translate(-50%,-50%)}
}
```
(`.vb-fill` stays empty on purpose. A fake progress fill would suggest something is loading.) The 13px `.video-bar` label is a numeric caption on video chrome, which is an accepted exception.

JS (`// ==== PKG-3: video placeholder ====`):
```js
  (function pkg3(){
    var fig=document.getElementById('video'), btn=document.getElementById('playBtn'), msg=document.getElementById('videoSoon');
    if(!fig||!btn) return;
    var scan=fig.querySelector('.video-scan'), anim=null, timer=null;
    var reduce=matchMedia('(prefers-reduced-motion: reduce)');
    function sweep(){
      if(reduce.matches||!scan.animate) return;
      if(anim) anim.cancel();                      // interruptible: restart cleanly
      anim=scan.animate([
        {opacity:0,transform:'translateX(-2%)'},
        {opacity:1,offset:0.08},
        {opacity:1,offset:0.92},
        {opacity:0,transform:'translateX(100%)'}
      ],{duration:1600,easing:'cubic-bezier(0.77,0,0.175,1)',fill:'none'});
    }
    function idle(){ clearTimeout(timer); fig.dataset.state='idle'; msg.textContent=''; btn.setAttribute('aria-label','Play video: how radar checks a flooded field'); }
    function soon(){
      fig.dataset.state='soon';
      msg.textContent='Video coming soon';
      btn.setAttribute('aria-label','Video coming soon. Press again to close.');
      sweep();
      clearTimeout(timer); timer=setTimeout(idle,3600);
    }
    btn.addEventListener('click',function(){ fig.dataset.state==='soon'?idle():soon(); });
    fig.addEventListener('keydown',function(e){ if(e.key==='Escape'&&fig.dataset.state==='soon'){ idle(); btn.focus(); } });
    // one sweep the first time the player is 40% visible
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); setTimeout(sweep,400); } },{threshold:0.4});
      io.observe(fig);
    }
  })();
```
The play button stays in the DOM and focusable during the "soon" state (opacity only), so a second press or Esc returns to idle at once.

Motion spec:

| Moment | Purpose | Property | Duration / curve | Trigger | Interrupt | Reduced |
|---|---|---|---|---|---|---|
| Card reveal | Pacing | opacity + Y 16 | 600ms `--ease-out`, stagger 60ms | reveal | one-shot | opacity |
| Card image settle | Pacing | scale 1.06 → 1 | 1200ms `--ease-out` | reveal | one-shot | none |
| Scan line | Explanation (it hints at what the video will show) | translateX −2% → 100% + opacity | 1600ms `--ease-in-out` (on-screen movement) | once at 40% visible (+400ms), and on each Play | `anim.cancel()` then restart | skipped |
| Play press | Feedback | scale .96 | 160ms `--ease-out` | :active | transition | none |
| Play hover | Affordance (gated) | scale 1.04 | 160ms `--ease-out` | hover | transition | — |
| Play → "coming soon" | State indication | button opacity 0 + scale .92 (160ms); pill opacity + Y 8 → 0 | pill 240ms `--ease-out`, 80ms delay | click | toggle / Esc / auto 3600ms | opacity only |

### Acceptance (PKG-3)
- No `#tl`, `.tl*` or worked-example section. No `.cloud/.rain/.sat/.beam/.flood/.pulse`. No yellow inside the section.
- Cards: full width, one line each, no icon tiles, photo flush to the card edge at both widths.
- The video is clearly a **video placeholder**: tag, play button, time bar. Play shows "Video coming soon" (announced by the live region), Esc or a second press closes it, and it reverts by itself after 3.6s. The scan runs once on first view and never loops.
- At 390px: the player is 4:5, the pill text wraps inside, the tag doesn't collide with the play button, the play target is 72px or more.

---

## PKG-4: comparison removal, For insurers swimlane, FAQ

**Owns**
- HTML: `<!-- 7. WITHOUT VS WITH -->` (415–437, **delete the whole section**), `<!-- 8. INSURERS -->` (439–462), `<!-- 9. FAQ -->` (464–478).
- CSS: `/* compare */` (154–163, **delete the whole block including `.sr`**; PKG-0 moved `.sr` to base), `/* insurers */` (165–175, delete dead `.flow*` lines), `/* insurer swimlanes */` (178–189), `/* faq */` (191–197). Old responsive lines: `.flow{…}` and `.flow li::after{…}` (1000 block), `.cmp{…}` and `.cmp th,.cmp td{…}` (880 block 1), `.lanes{…}`, `.lane,.lane-lines{…}`, `.lstep{margin:0}`, `.ltag{display:block}` (880 block 2), `.flow{…}` (560 block).
- JS: new block `// ==== PKG-4: insurers + faq ====`.
- Insertion: `/* PKG-4: insurers + faq */`.

### 4a. Delete the comparison table
Remove lines 415–437 and the `/* compare */` CSS.

### 4b. For insurers
```html
<section class="sec ins" id="insurers">
  <div class="wrap">
    <div class="reveal">
      <p class="eyebrow">For insurers</p>
      <h2 class="h2">Decide claims with the evidence already attached.</h2>
      <p class="lead">Reach farmers who need cover. Your adjuster makes every decision. AiGRI prepares the case and pays out after you approve.</p>
    </div>
    <div class="lanes reveal" role="list" aria-label="How a claim moves between your team and AiGRI">
      <div class="lane lane-team" aria-hidden="true">Your team</div>
      <div class="lane lane-ai" aria-hidden="true">AiGRI</div>
      <svg class="lane-lines" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true"><path d="M100 90 H200 V270 H300 H500 H600 V90 H700 H800 V270 H900" fill="none" stroke="#FFFFFF" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
      <div class="lane-wipe" aria-hidden="true"></div>
      <div class="lstep" role="listitem" style="grid-column:1;grid-row:1;--t:150ms"><span class="ltag">Your team</span><b>1. Publish</b><span>Upload a policy PDF, review it, publish.</span></div>
      <div class="lstep" role="listitem" style="grid-column:2;grid-row:2;--t:450ms"><span class="ltag">AiGRI</span><b>2. Match</b><span>Ranks your policy for each client's risk.</span></div>
      <div class="lstep" role="listitem" style="grid-column:3;grid-row:2;--t:750ms"><span class="ltag">AiGRI</span><b>3. Prepare</b><span>A claim packet with satellite evidence and a proposed amount.</span></div>
      <div class="lstep dec" role="listitem" style="grid-column:4;grid-row:1;--t:1050ms"><span class="ltag">Your team</span><b>4. Decide</b><span>Your adjuster approves, asks for more, or denies.</span></div>
      <div class="lstep" role="listitem" style="grid-column:5;grid-row:2;--t:1350ms"><span class="ltag">AiGRI</span><b>5. Pay</b><span>Automatic payout from your wallet once approved.</span></div>
    </div>
    <a class="btn btn-w btn-lg" href="/partners">Become a partner insurer</a>
    <div class="logos" aria-label="Partner insurers, placeholders">
      <div class="logo-ph">[Insurer logo]</div><div class="logo-ph">[Insurer logo]</div><div class="logo-ph">[Insurer logo]</div>
    </div>
  </div>
</section>
```
Remove the inline `style="color:#fff"` on the h2 and lead (handled in CSS).

CSS (replace `/* insurers */` and `/* insurer swimlanes */`):
```css
.ins{background:var(--green);color:#fff}
.ins .eyebrow,.ins .h2,.ins .lead{color:#fff}
.logos{display:flex;gap:14px;flex-wrap:wrap;margin-top:32px}
.logo-ph{flex:1 1 160px;min-height:64px;background:#fff;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:var(--fs-small);font-weight:600;color:var(--muted)}
.lanes{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:180px 180px;margin:0 0 48px}
.lane{grid-column:1/-1;align-self:start;padding:0 4px;font-size:var(--fs-label);font-weight:700;letter-spacing:var(--tr-label);text-transform:uppercase;color:#fff}
.lane-team{grid-row:1}
.lane-ai{grid-row:2;margin-top:4px}
.lane-lines{grid-column:1/-1;grid-row:1/3;width:100%;height:100%;z-index:1}
.lane-wipe{grid-column:1/-1;grid-row:1/3;z-index:1;background:var(--green);transform-origin:right center;transform:scaleX(0)}
.lstep{position:relative;z-index:2;align-self:center;margin:0 10px;background:#fff;color:var(--ink);border-radius:16px;padding:16px;font-size:var(--fs-small);line-height:1.4}
.lstep b{display:block;font-size:17px;margin-bottom:4px}
.lstep span:last-child{color:var(--muted)}
.lstep.dec{background:var(--ink);color:#fff}
.lstep.dec span:last-child{color:#fff}
.ltag{display:none;font-size:var(--fs-label);font-weight:700;letter-spacing:var(--tr-label);text-transform:uppercase;color:var(--green);margin-bottom:4px}
.lstep.dec .ltag{color:#fff}
/* draw: the green wipe uncovers the white line left to right; cards arrive as the line reaches their column */
.js .lanes .lane-wipe{transform:scaleX(1)}
.js .lanes.in .lane-wipe{transform:scaleX(0);transition:transform 1500ms linear 150ms}
.js .lanes .lstep{opacity:0;transform:translateY(12px)}
.js .lanes.in .lstep{opacity:1;transform:none;transition:opacity 300ms var(--ease-out) var(--t),transform 300ms var(--ease-out) var(--t)}
.js .lanes .lstep.dec{transform:translateY(12px) scale(.97)}
.js .lanes.in .lstep.dec{transform:none;transition:opacity 300ms var(--ease-out) var(--t),transform 340ms var(--ease-out) var(--t)}
.js .lanes.reveal{transform:none}  /* the container only fades; its children carry the motion */
@media (max-width:1000px){
  .lanes{display:flex;flex-direction:column;gap:12px}
  .lane,.lane-lines,.lane-wipe{display:none}
  .lstep{margin:0;align-self:stretch}
  .ltag{display:block}
  .js .lanes.in .lstep,.js .lanes.in .lstep.dec{transition-delay:calc(var(--n,0) * 60ms)}
}
@media (prefers-reduced-motion:reduce){
  .js .lanes .lane-wipe{display:none}
  .js .lanes .lstep,.js .lanes .lstep.dec{transform:none}
  .js .lanes.in .lstep{transition:opacity 300ms ease}
}
```
Add `--n:0..4` to each `.lstep` style (alongside `--t`) for the stacked 60ms stagger.
- The connector draw uses **transform only**: a section-green cover (`.lane-wipe`) scales from `scaleX(1)` to `0` with its origin on the right, so the white line appears left to right. **Linear**, 1500ms, chosen on purpose: the cards' arrival delays (150/450/750/1050/1350ms) are timed to the column centres (10/30/50/70/90%), and only a linear wipe keeps them in sync. It reads as a progress hand-off. **Gate:** rare. **Purpose:** explanation (who does what, in what order). The Decide card gets an extra scale .97 → 1 for emphasis. Yellow is removed (white line, ink Decide card).
- Lane fills and the `margin-top:24px` are removed, so the line ends meet the card centres (rows of 180px, path at y = 90/270).

### 4c. FAQ
Markup: keep the `<details class="faq">` items, but wrap each answer: `<details class="faq"><summary>…<svg class="plus">…</svg></summary><div class="faq-body"><p>…</p></div></details>`. Change the plus icon stroke to `currentColor`. The wrap loses `style="max-width:940px"` (it uses the normal 1160 wrap); add `<div class="faq-list">` around the items. Questions (7):
1. Is it free? — [Pricing to be decided.]
2. Who decides my claim? — (keep)
3. What is satellite evidence? — "Readings from public satellites showing whether each of your fields flooded and how the crop changed, with a confidence level. It supports your claim. It does not replace your photos or the adjuster."
4. What if my photo does not pass a check? — (keep)
5. Who can see my farm data? — (keep)
6. **Do I need a smartphone?** — "[Device requirements to be confirmed.]"
7. Where does it work? — (keep)

CSS (replace `/* faq */`):
```css
.faq-list{display:flex;flex-direction:column;gap:8px;max-width:820px}
.faq{background:var(--surface-2);border-radius:var(--r-md)}
.faq summary{cursor:pointer;list-style:none;padding:22px 24px;min-height:64px;font-size:19px;font-weight:600;display:flex;justify-content:space-between;align-items:center;gap:16px;border-radius:var(--r-md);
  -webkit-user-select:none;user-select:none;transition:background-color var(--dur-fast) ease}
.faq summary::-webkit-details-marker{display:none}
.faq summary:active{background:var(--surface-3)}
.faq .plus{flex:none;color:var(--green);transition:transform var(--dur-fast) var(--ease-out)}
.faq[open] .plus{transform:rotate(45deg)}
.faq-body{overflow:hidden}
.faq-body p{margin:0;padding:0 24px 24px;color:var(--muted);font-size:var(--fs-body);max-width:720px}
@media (hover:hover) and (pointer:fine){ .faq summary:hover{background:var(--surface-3)} }
@media (prefers-reduced-motion:reduce){ .faq .plus{transition:none} }
```
JS (`// ==== PKG-4: insurers + faq ====`), the accordion with WAAPI (works in Safari, can be interrupted):
```js
  (function pkg4(){
    var reduce=matchMedia('(prefers-reduced-motion: reduce)');
    [].forEach.call(document.querySelectorAll('.faq'),function(d){
      var s=d.querySelector('summary'), b=d.querySelector('.faq-body'), p=b&&b.querySelector('p'), a=null, closing=false;
      if(!s||!b) return;
      s.addEventListener('click',function(e){
        if(reduce.matches||!b.animate) return;           // native snap
        e.preventDefault();
        var from=b.getBoundingClientRect().height;        // current height (mid-animation safe)
        if(a) a.cancel();
        if(d.open && !closing){                          // close: 200ms, faster than open
          closing=true;
          a=b.animate([{height:from+'px'},{height:'0px'}],{duration:200,easing:'cubic-bezier(0.23,1,0.32,1)'});
          a.onfinish=function(){ d.open=false; closing=false; a=null; };
        }else{                                           // open (or reverse a close): 260ms
          closing=false; d.open=true;
          var to=b.scrollHeight;
          a=b.animate([{height:from+'px'},{height:to+'px'}],{duration:260,easing:'cubic-bezier(0.23,1,0.32,1)'});
          if(p&&from===0) p.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:200,delay:60,easing:'cubic-bezier(0.23,1,0.32,1)',fill:'backwards'});
          a.onfinish=function(){ a=null; };
        }
      });
    });
    // stacked swimlane needs the plain index; desktop uses --t
    [].forEach.call(document.querySelectorAll('.lanes .lstep'),function(el,i){ if(!el.style.getPropertyValue('--n')) el.style.setProperty('--n',i); });
  })();
```
(For a closed `<details>` the body has 0 height, so `from` is 0 on first open.)
- **Gate:** occasional. **Purpose:** preventing a jarring change. **Open:** 260ms. **Close:** 200ms (exit faster). `height` is the sanctioned accordion exception. The answer text fades in with opacity + Y −4 → 0 over 200ms, 60ms delay. **Interruption:** the animation starts from the current measured height. **Reduced motion:** native snap. The plus rotate is 200ms `--ease-out`.

### Acceptance (PKG-4)
- No `.cmp`, comparison section, `.flow*` or `.sec-mist` in PKG-4 regions. No yellow inside `#insurers`.
- Desktop: the line draws left to right once, and cards arrive as it reaches them. Decide is the ink card.
- At 1000px and below: cards stack at full width (no ragged widths), with lane tags visible.
- FAQ: rows are solid `#F5F5F7` with 8px gaps and no lines. Open and close are animated, rapid clicks never jump, and keyboard Enter/Space works. The left edge lines up with the other sections.
- White focus ring visible on the green section.

---

## 4. Ownership map (no overlaps)

| Region | PKG-0 | PKG-1 | PKG-2 | PKG-3 | PKG-4 |
|---|---|---|---|---|---|
| `<head>` meta | | ✓ | | | |
| CSS `:root`, base, buttons, scaffolding (`.sec` `.eyebrow` `.h2` `.lead` `.band`), reveal | ✓ | | | | |
| CSS `.card`, `.card-img` | | | | ✓ | |
| CSS header, cta + footer | | ✓ | | | |
| CSS hero, phone story, how-it-works, gap, all @keyframes | | | ✓ | | |
| CSS two cards, timeline, satellite | | | | ✓ | |
| CSS compare, insurers, swimlanes, faq | | | | | ✓ |
| Old responsive and reduced-motion lines | global lines | own selectors | own selectors | own selectors | own selectors |
| HTML skip, header, CTA, footer | | ✓ | | | |
| HTML 1 hero, 2 how, 3 gap | | | ✓ | | |
| HTML 4 cover, 5 worked example, 6 satellite | | | | ✓ | |
| HTML 7 compare, 8 insurers, 9 FAQ | | | | | ✓ |
| JS lines 502–513 + top of IIFE | | ✓ | | | |
| JS lines 515–534 | | | ✓ | | |
| New CSS block before `/* responsive */` | — | PKG-1 | PKG-2 | PKG-3 | PKG-4 |
| New JS block before `})();` | — | PKG-1 | PKG-2 | PKG-3 | PKG-4 |

Cross-package contracts: `.reveal` and `.in` (PKG-0 CSS + PKG-1 JS), `html.js` (PKG-1), `--focus` scoping (PKG-0), all tokens (PKG-0), `.sec-alt` (PKG-0, used by PKG-3), `.btn-y` / `.btn-w` (PKG-0).

---

## 5. Integration checklist (for you, after all packages land)

### Consistency
- [ ] Run `grep -nE "vh|svh|dvh" index.html`: no matches in CSS (JS `innerHeight` is fine).
- [ ] Run `grep -n "FFCB3D\|--sun" index.html`: only in `.btn-y`, the logo suns / i-dots (header, footer, CTA mark) and `:root`.
- [ ] Run `grep -nE "border(-top|-bottom)?:\s*1px|inset 0 0 0" index.html`: no hairlines or rings.
- [ ] Run `grep -n "infinite" index.html`: no results.
- [ ] Run `grep -nE ":hover" index.html`: every match is inside `@media (hover:hover) and (pointer:fine)`.
- [ ] Run `grep -nE "transition:\s*all|scale\(0\)|ease-in[^-]"`: none.
- [ ] Delete empty `@media (…){ }` wrappers left under `/* responsive */`. Delete the legacy `:root` aliases (`--mist --tint --line --sun-hover`) once grep shows no users.
- [ ] Exactly one `<script>` and one IIFE. All PKG blocks are inside it. PKG-1's `js` class line is the first statement.
- [ ] Get covered ×3 → `/signup`. Nav links resolve to existing ids (`#how #cover #proof #insurers #faq`). `#get-covered` is on the CTA section only. No `.cmp`, `#tl`, `.chips`, `.cue`, `.phone`, `.flow` remain.
- [ ] Eyebrow and h2 rhythm is the same in every section. FAQ left edge lines up with other sections.
- [ ] Copy: no "real risk", and no "You only act on two". Verify the gap figures (PHP 4.13B; 1–26 Aug 2026; PHP 187M; >60% uninsured) word for word against the Insurance Business Asia article, and fill in `[article date]`.
- [ ] Run `.claude/skills/impeccable/scripts/impeccable detect --json landing-preview/index.html` once. Expect no `icon-tile-stack` and no `extreme-negative-tracking` at mobile.

### Motion (play at 3× slower in DevTools › Animations)
- [ ] Hero: h1 painted at frame 1. Stagger 0/60/120/180/240ms reads as a cascade. The image settle stops (check at 10s: no transform running).
- [ ] Reveals: 600ms, 16px, same curve on opacity and transform. Card pairs and satellite columns stagger 60ms.
- [ ] Gap bar fills once, and the label fades in after it.
- [ ] Timeline: no lag behind scroll, nodes pop from .9 (not 0), it reverses cleanly, and the mobile vertical fill matches the node centres.
- [ ] Video: one sweep on first view, Play → pill (button fades out, pill rises in), Esc / second press / 3.6s → idle. Spam-clicking Play never stacks sweeps.
- [ ] Swimlane: the wipe and cards stay in sync. Decide has a slight scale. Stacked: 60ms cascade.
- [ ] FAQ: open 260ms, close 200ms, double-click mid-animation reverses smoothly.
- [ ] Menu: enter 220ms drawer curve with link cascade, exit 160ms, X morph.
- [ ] CTA sun-rise plays once.

### Reduced motion (DevTools › Rendering › prefers-reduced-motion: reduce)
- [ ] No translate, scale or wipe anywhere. Reveals are opacity 300ms. Hero texts fade. The image and h1 are static.
- [ ] Timeline still fills with scroll (user-driven) and nodes still change colour.
- [ ] Video: no sweep, the state change is opacity only. FAQ snaps. Menu fades only. The swimlane shows the line at once.

### No-JS (DevTools › disable JavaScript)
- [ ] Every section heading, card, video, swimlane and CTA is fully visible (nothing at opacity 0).
- [ ] The timeline is fully lit, the gap bar is full, the swimlane line is visible.
- [ ] FAQ works natively. The menu button does nothing at mobile width. Accepted trade-off: nav anchors are hidden on mobile without JS. If unacceptable, add `html:not(.js) .nav{visibility:visible;opacity:1;transform:none;position:static}` in PKG-1.

### Mobile 390px (real phone if possible; desktop Chrome's minimum window is about 500px, so use device mode or a phone)
- [ ] No horizontal scroll at 390 or 360.
- [ ] Header: logo 41px tall (about 121px wide, which meets the 120px minimum), Get covered 44px tall, menu 44×44.
- [ ] Hero: min-height 640px, CTA visible without scrolling on a 390×844 phone, buttons stacked, trust line visible.
- [ ] Tap targets 44px or more: nav links (48), footer links (44), credits summary (44), FAQ rows (64), play (72).
- [ ] No grey tap flash. No sticky hover after a tap (check the Play button, FAQ rows and nav).
- [ ] Anchors land below the sticky header (`scroll-padding-top:80px`).
- [ ] Video at 4:5. The tag and the "Video coming soon" pill wrap inside the frame.
- [ ] Body text 17px, labels 15px or more (13px only for caps eyebrows/labels and the video time).

### Contrast (computed from hex)

| Pair | Ratio | Use | Result |
|---|---|---|---|
| ink `#1F2A1B` on white | 14.94 | body, headings | Pass |
| muted `#44533F` on white / `#F5F5F7` / cream | 8.22 / 7.55 / 7.74 | secondary text | Pass |
| ink on `#F5F5F7` / `#EDEDF0` | 13.72 / 12.79 | FAQ, cards | Pass |
| green `#557945` on white / `#F5F5F7` / cream | 4.99 / 4.58 / 4.70 | eyebrows (13px bold caps), gap number (large) | Pass AA |
| white on green | 4.99 | insurer copy, focus ring on green | Pass (ring ≥ 3:1) |
| white on ink | 14.94 | Decide card, footer, video pills | Pass |
| cream on ink | 14.07 | footer text | Pass |
| ink on sun `#FFCB3D` | 9.86 | Get covered | Pass |
| sun on green | 3.29 | reversed i-dot (logo only) | Logo, n/a |
| white on scrim base `#12220E` | 16.66 | hero text at the bottom of the scrim | Pass. **Check** the h1's top line over the brightest grass (scrim about 0.3 there, about 4.8:1 estimated, needs 3:1 for large text). |
| ink focus ring on white | 14.94 | default ring | Pass |
| track `#E3E3E0` on white | 1.29 | timeline hint only | Accepted (the fill and nodes carry the state) |
| green fill on `#E3E3E0` track | 3.88 | timeline fill | Pass 3:1 |
| green fill on ink track | 2.99 | gap bar | Borderline. Meaning comes from the labels; if you want a strict 3:1, change the fill to white (14.94). |
| white track on cream | 1.06 | — | **Not used** (reason the gap track is ink) |

### Judgment calls to confirm with the owner
- The hero scrim is a **gradient** on the photo (a legibility treatment, not a UI fill). If "solid colours only" covers photos too, swap it for a uniform `rgba(18,34,14,.42)`, which muddies the field slightly.
- `hero.jpg` is reused in the Crops card (no new images allowed); the crop differs.
- Header logo static; the brand sun-rise lives only at the CTA.
