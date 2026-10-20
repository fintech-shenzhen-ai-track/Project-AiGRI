A select picks one option from a short list using the browser's native menu.

**When to use**
- Use `select` for 4 to 15 options such as regency or payout method. For 2 to 4 short options that change a view, use `seg`. For a few large options with descriptions, use `choice` cards.

**What the consumer provides**
- A native `<select class="select">` inside `<div class="select-wrap">`, which draws the chevron.
- A visible `label.field-label` inside a `.field`, plus `.field-hint` or `.field-error`.
- Options from the active country pack, not hard-coded strings.

**Do**
- Keep the 52px height and 17px text.
- Mark errors with `aria-invalid="true"`; the fill becomes `denied-bg`.

**Don't**
- Build a custom listbox when the native one works.
- Use a select for two options.
