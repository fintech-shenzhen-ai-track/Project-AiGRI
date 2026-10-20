Choice controls let a person pick: large `choice` cards, `check`, `radio`, `switch`, `seg` and `chip`.

**When to use**
- `choice` for a few large options with a description (account type, crops or livestock, payout method). Selected state is `is-sel` plus `aria-pressed="true"`: `cream` fill and a green check badge, never a border.
- `check` for independent yes/no; `radio` for one of a small set; `switch` (51×31) for an immediate on/off setting such as alerts.
- `seg` for 2 to 4 short options that change a view in place. `chip` (36px) for filters; selected chips fill `ink` with white text.

**What the consumer provides**
- Native inputs inside `label.check`, `label.radio` and `.switch`; keep `role="switch"` on switches.
- For `choice`, toggle `is-sel` and `aria-pressed` together and include the `.choice-badge` check.
- A text label next to every control.

**Do**
- Keep targets at 44px or more; the 24px box sits in a larger label.
- Use `muted` for descriptions on `surface-2`.

**Don't**
- Signal selection with a coloured border or only by colour.
- Use a switch for a choice that needs a Save button.
