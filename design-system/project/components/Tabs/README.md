Tabs switch between panels of the same page; a green bar marks the active tab.

**When to use**
- `tabs` for views of one list with counts (All, Open, Info requested). For 2 to 4 short options that change a view in place, use `seg` from Choice. For app-level navigation, use the sidebar or the mobile tab bar (AppShell).

**What the consumer provides**
- `role="tablist"` on `.tabs`, `role="tab"` buttons with `aria-selected` and `aria-controls`, and `role="tabpanel"` panels with `aria-labelledby`. Hide inactive panels with `hidden`.
- Counts as `nav-badge` (`is-need` for needs-attention counts).
- Include the `.tabs-ink` span; script sets its `transform: translateX() scaleX()` over 240ms to follow the active tab. Without script the active tab shows a 3px `green` underline.

**Do**
- Keep tab labels short and 44px tall; selected is `ink` 600, others `muted`.

**Don't**
- Draw a track line under inactive tabs.
- Put more than about six tabs in a row; on mobile the row scrolls.
