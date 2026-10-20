# 03 UI shell and design system: plan

## Owns

`portals/` except the route folders owned by features 04, 06–14 and 17 (see `specs/00-shared/ownership.md`).

## Stack

Next.js (current stable, App Router, React Server Components), TypeScript strict, pnpm, plain CSS (the ported `system.css` as a global stylesheet plus CSS Modules only for component-local additions), `openapi-typescript` + a thin `fetch` wrapper, MapLibre GL JS + Terra Draw for the `maplibre` map renderer (D-13), Vitest + Testing Library, Playwright + axe for e2e. No UI kit, no Tailwind: the class names in DESIGN.md are the API.

## Routes

URL prefixes are real path segments so a role guard can match them.

| Portal | Route | Feature | Prototype |
| --- | --- | --- | --- |
| Public | `/` | 17 | `landing-preview/index.html` |
| Public | `/sign-in` | 03 | c01 |
| Capture | `/capture/[token]` | 06 | sheets in c04, c10, c11 |
| Client | `/client/onboarding` | 06 | c02 |
| Client | `/client/home` | 09 | c09 |
| Client | `/client/farm` (parcels), `/client/farm/livestock` | 06 | c03, c04 |
| Client | `/client/risk` | 07 | c05 |
| Client | `/client/cover`, `/client/cover/[recordKey]` | 07 | c06, c07 |
| Client | `/client/cover/buy/[purchaseId]` | 08 | c08 |
| Client | `/client/alerts`, `/client/alerts/[alertId]` | 09 | c10 |
| Client | `/client/claims`, `/client/claims/[claimNo]`, `/client/claims/[claimNo]/check` | 11 | c12, c11 |
| Client | `/client/wallet` | 12 | c13 |
| Client | `/client/settings` | 03 | none (D-14) |
| Insurer | `/insurer/dashboard` | 13 | i01 |
| Insurer | `/insurer/products`, `/insurer/products/[recordId]` | 04 | i02 |
| Insurer | `/insurer/underwriting` | 08 | none (D-14) |
| Insurer | `/insurer/claims`, `/insurer/claims/[claimNo]` | 11 | i03, i04 |
| Insurer | `/insurer/portfolio` | 13 | i05 |
| Insurer | `/insurer/wallet` | 12 | i06 |
| Admin | `/admin/overview`, `/admin/insurers`, `/admin/quality`, `/admin/disputes`, `/admin/packs`, `/admin/audit` | 14 | a01–a06 |
| Dev | `/dev/kitchen-sink`, `/dev/inbox`, `/dev/clock` | 03, 01 | kitchen sink |

`middleware.ts` reads `/api/v1/auth/me` (cached per request) and enforces the prefix ↔ role mapping.

## Layout

```
portals/
  app/layout.tsx                 html lang=en, color-scheme light, sprite, toast region
  app/client/layout.tsx          AppShell portal="client"
  app/insurer/layout.tsx         AppShell portal="insurer" (+ min-width notice)
  app/admin/layout.tsx           AppShell portal="admin"
  app/sign-in/page.tsx
  app/dev/...
  components/<Name>/index.tsx    one folder per component
  components/icons/sprite.tsx    every icon from PLAN 4.3
  components/logo/               inline SVGs from PLAN 4.6
  lib/api/                       types.ts (generated), client.ts, errors.ts
  lib/pack/                      PackProvider, format.ts, useFormat()
  lib/motion/                    reveal, countUp, reducedMotion(), still mode
  lib/nav.ts
  public/manifest.webmanifest, icons/*, sw.js
  scripts/design-lint.mjs
  styles/system.css
```

## Porting `system.js`

Map each declarative hook in PLAN 4.2 to a component or hook: `.rv` → `<Reveal i={n}>`; `[data-tabs]` → `<Tabs>`; `[data-seg]` → `<Seg>`; `[data-open]` → `<Sheet>`/`<Modal>` with `useDialog()`; `[data-toast]` → `toast()`; `[data-stub]` → not needed in production (every link is real); `[data-count]` → `<CountUp>`; `svg.chart[data-draw]` → `<Chart>`; `.sat[data-compare]` → `<SatelliteCompare>`; `[data-select-group]` → `<ChoiceGroup>`/`<ChipGroup>`; `[data-flow]` → `<Flow>` with `<Stepper>`; `details.disc` → `<Disclosure>`; `[data-copy]` → `<Hash>` copy button; `.sun-rise` → `<SunRiseMark>`. Dialogs use native `<dialog>` with `showModal()` and the border/padding reset (PLAN 9.6).

## Visual regression

Playwright captures the kitchen sink and each shell at 1280 and 390 in still mode and compares against `system-preview/**/shots/*.png` where a matching shot exists. The comparison is a report, not a gate (the prototype was hand-built), but a diff over 5% on the kitchen sink fails the build.

## Risks

- Next.js default styles or fonts sneaking in: no `next/font` downloads; system stack only.
- Hydration flashes on reveal animations: reveals render final state on the server and animate only with `html.js`, as the prototype does.
