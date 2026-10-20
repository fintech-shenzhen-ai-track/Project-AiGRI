The stepper shows where a person is in a short multi-step flow, with a green fill growing along a track.

**When to use**
- Onboarding and purchase flows of 3 to 6 steps (Account type, What you farm, Business details, Payout account). For a record's history, use Timeline.

**What the consumer provides**
- `stepper` with `--n` (step count) and `--p` (fill, 0 to 1, as the fraction of completed gaps), a `stepper-track` holding `stepper-fill`, and one `step` per stage with `step-dot` and `step-label`.
- State classes: `is-done` (green dot, white tick), `is-now` (ink dot, white numeral, `aria-current="step"`), none for to-do (`track` dot, `muted` numeral).
- On mobile (600px and below) show `stepper-compact`: "Step 2 of 4 · What you farm" with a `meter` beneath.

**Do**
- Animate the fill with `scaleX` over 600ms `ease-out`; under reduced motion it jumps.
- Keep labels at 15px.

**Don't**
- Let a person skip a required step.
- Use `sun` for the current step; it is `ink`.
