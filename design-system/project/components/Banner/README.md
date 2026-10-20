A banner puts a status message in a solid coloured block with an icon, a title and optional actions.

**When to use**
- `banner-ok`, `banner-info`, `banner-need`, `banner-denied`, `banner-alert` for a message tied to the page, such as a policy issued, a claim drafted by AiGRI, a request from the insurer, a denial or a degraded system.
- `banner-alert is-strong` (solid `alert`, white text) once per Home for a live hazard. Add `role="alert"` once, on arrival.
- For errors that need action, use a banner, not a toast.

**What the consumer provides**
- `.banner-icon` holding a 24px icon, `.banner-title` (one line, 17px 600), `.banner-text` (15px) and optionally `.banner-actions` with `btn-ghost`, `btn-ink` or `btn-w` buttons.
- Plain copy that says what happened, what is safe and what to do next.

**Do**
- Let it enter with the standard reveal and not animate again.
- Add a close `icon-btn` with `aria-label` if it can be dismissed.

**Don't**
- Use a banner for a passing confirmation ("Copied"); that is a toast.
- Add a coloured left stripe or border.
