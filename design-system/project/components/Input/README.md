Text inputs capture one value on a solid `surface-2` field with no border.

**When to use**
- `input` for single-line text, `textarea` for notes, `affix` when a unit or currency sits inside the field ("Rp", "ha", "head"), `otp` for a six-digit code.
- Read-only compiled policy fields use `input` with `readonly` (white fill) and a `cite` chip on the right.

**What the consumer provides**
- A `.field` wrapper holding `label.field-label` (always visible), the control, then `.field-hint` or `.field-error` with an alert icon.
- `aria-invalid="true"` plus `aria-describedby` pointing at the error; the field turns `denied-bg`.
- Units and currency read from the country pack, not typed into the component.

**Do**
- Keep text at 17px (`fs-body`) so iOS does not zoom.
- Say what is wrong and how to fix it in the error: "NIB has 13 digits."
- On `surface-2`, write hints in `muted`, not `muted-2`.

**Don't**
- Replace the label with placeholder text; `muted-2` placeholders fall under 4.5:1 on `surface-2`.
- Add borders, dashed outlines or inset rings. Focus shows a white fill plus the 3px `focus` ring.
