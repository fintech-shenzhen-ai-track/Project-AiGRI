A table lists records in rows with no lines, only solid fills and rounded row ends.

**When to use**
- Dense lists in the insurer and Superadmin portals: claims, policies, payouts, country packs. For a short list a person acts on one by one, use cards or `parcel-tile`.

**What the consumer provides**
- `table` with a header row in `label` style, 56px body rows with 15px cells; rows alternate `white` and `surface-1`.
- Numbers in `td.num` or `.r` (right-aligned, tabular). IDs in `td.id` (600 weight, never reformatted).
- `tr.is-flag` for a row that needs attention (also carry a status pill), `tr.is-sel` for the selected row, `data-href` and `tabindex="0"` for a clickable row (Enter opens it).
- `table-tools` above: chips or tabs, search and a count ("41 open claims").
- For mobile add `table-stack` and a `data-l` label on each cell; each row becomes a white card.

**Do**
- Put money in the pack's format and the full figure in `title` when you show a compact one.
- Wrap in `table-wrap` so wide tables scroll.

**Don't**
- Add row dividers or cell borders.
- Animate rows.
