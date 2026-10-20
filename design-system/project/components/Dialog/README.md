Dialogs sit above the page: a centred modal for an irreversible step, and a sheet for detail that does not leave the page.

**When to use**
- `dialog.modal` only to confirm an irreversible step: submit a claim, confirm a payment, deny a claim. At 600px and below it renders as a bottom sheet.
- `dialog.sheet` for detail: clause text, photo detail, withdraw, capture. It is a 440px right panel on desktop and a bottom sheet on mobile (`sheet-grab` shows there).
- Do not open a modal as the first idea.

**What the consumer provides**
- A native `<dialog>` opened with `showModal()` so focus is trapped and Esc closes; return focus to the trigger on close. Toggle `is-open` after opening for the transition.
- `ov-head` with an `h-section` title (and a close `icon-btn` with `aria-label` on a sheet), `ov-body`, and `ov-foot` with the primary action on the right (full width on mobile).
- A button label that says what happens, with the amount: "Pay now" after a title that names "Rp13.440.000".
- The `is-static` class only for documentation previews.

**Do**
- Enter the modal from `scale(.96)` over 240ms `ease-out`; the sheet over 320ms `ease-drawer`; exit in 180ms. Under reduced motion both fade.
- The scrim is a solid `rgba(31,42,27,.32)`, no blur.

**Don't**
- Stack a modal on a modal.
- Use a modal for a message; use a banner or toast.
