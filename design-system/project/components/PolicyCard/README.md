The policy card shows one ranked insurance product from the Curation result, with its figures and the clauses behind its rank.

**When to use**
- On the Cover screen and the insurer preview, one card per product in rank order.
- `policy is-top` (cream) for the best fit, with an ok pill "Best fit for your risk". `policy is-off` for products the client is not eligible for.

**What the consumer provides**
- Rank numeral, insurer name with its neutral `ins-mark` initials (never a logo), product name, ratio ("expected payout per Rp1 of premium").
- Three figures (premium, sum insured, expected payout) already formatted by the country pack: `Rp13.440.000`.
- Up to three reasons, each with a `cite` chip for its clause. With no clause, say "Not stated in this policy."
- For `is-off`, a reason line with the rule that excludes the product.
- A `demo-note` at the end of any screen that shows policies.

**Do**
- Put the clause chip next to the claim it supports.
- Use `btn-ink` for See policy on the top card and `btn-soft` on others; keep `btn-y` for the purchase step.

**Don't**
- Invent insurer names or show insurer logos.
- Write "AI-approved" or imply AiGRI decides; the client chooses.
