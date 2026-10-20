Buttons trigger an action; the yellow one marks the single commitment on a view.

**When to use**
- `btn btn-y` for the one primary action per view: Get covered, Confirm and pay, Approve claim. At most one per view, ink label.
- `btn btn-ink` for a strong secondary action, or the primary when the action is not a commitment (Continue, Save).
- `btn btn-soft` for secondary actions. `btn btn-ghost` for tertiary inline actions ("View clause"). `btn btn-danger` for Deny or Remove, never solid red. `btn btn-w` on `green`, `ink` or photo surfaces.
- `icon-btn` (44×44) for a lone icon; give it an `aria-label`.

**What the consumer provides**
- A `<button type="button">` or `<a>` with the classes above and a label that says what happens, with the amount when money moves: "Confirm and pay Rp13.440.000".
- Size modifiers `btn-sm` (40px), default 48px, `btn-lg` (56px); `btn-block` for full width (all primary buttons on mobile).
- State: `disabled`, or `is-loading` with `aria-busy="true"` (the label keeps its width, three dots show).

**Do**
- Press feedback is built in (`scale(.97)`, 160ms); keep it.
- Pair an icon with a label using `i i-sm`.

**Don't**
- Use `btn-y` twice on a view, or for a highlight, badge or status.
- Round the corners differently; buttons are `r-pill`.
