The timeline lists what happened to a claim or policy, newest steps on a vertical track with pins.

**When to use**
- Claim and policy detail pages to show who did what and when. For progress through a form, use Stepper.

**What the consumer provides**
- `tl` with `--p` (fill 0 to 1), a `tl-track` holding `tl-fill`, and one `tl-item` per event with `tl-pin`, `tl-when`, `tl-title` and an optional `tl-body`.
- `tl-when` as the date and time with the pack's time zone: "16 Feb 2026 · 08:20 WIB".
- State on the item: `done` (green pin, tick), `is-now` (ink pin), `is-need` (`need` pin), `is-denied` (`denied` pin), none for upcoming.
- `tl-body` may hold a hash (`mono`) or a quote from the adjuster.

**Do**
- Name who acts: "Under review by Dimas Prasetyo". The adjuster decides; AiGRI prepares.
- When status changes, extend the fill with `scaleY` (600ms), then colour the pin (200ms).

**Don't**
- Say "AiGRI approved".
- Use relative times without the date.
