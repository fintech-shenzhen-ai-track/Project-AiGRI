A toast confirms a system action in one short line and then leaves.

**When to use**
- Passing confirmations: "Copied", "Saved", "Payout sent to CV Tani Makmur Demak's wallet".
- Never for an error that needs action; use a Banner.

**What the consumer provides**
- A `.toast-region` container (bottom right on desktop, bottom centre above the tab bar on mobile) with `role="status"` and `aria-live="polite"`.
- Each `.toast` with `data-tone` (`ok`, `info`, `need`, `alert`), a 20px icon, the message and an optional `toast-action` link.
- Add `in` to show and `out` to hide, using transitions so rapid toasts retarget.

**Do**
- Show 3 at most; auto-dismiss after 4 seconds, paused on hover and while the tab is hidden.
- Enter over 320ms `ease-drawer` (translateY 16px); exit in 180ms.

**Don't**
- Put required decisions in a toast.
- Use it for a long message; keep to one line.
