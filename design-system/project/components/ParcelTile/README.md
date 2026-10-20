A parcel tile is a list item for one plot of land: a thumbnail of its shape, its name and details, and its status.

**When to use**
- Beside the map on Farm and Risk, and wherever a person picks or reviews a parcel. The list gives the same data as the map, so the map is never the only way in.

**What the consumer provides**
- `parcel-thumb` holding a 44px SVG of the polygon filled with a data token: `parcel` insured, `parcel-risk` in a forecast hazard area, `parcel-off` not covered.
- An `h-card` name ("DMK-01 · Karanganyar Utara"), a detail line (area from the pack, variety, planting date) and a status `pill`.
- `is-sel` on the selected tile (`cream`). Make the tile an `<a>` or button.

**Do**
- Write the area with the pack's unit (`9,6 ha`; rai in Thailand).
- Use `muted` for the detail line on `surface-2`.

**Don't**
- Colour the thumbnail without a legend or status pill beside it.
- Use a border to show selection.
