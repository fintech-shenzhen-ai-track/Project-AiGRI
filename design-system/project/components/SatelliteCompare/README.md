The satellite compare is a 16:10 frame with a before layer and an after layer, split by a draggable divider, with the readings under it.

**When to use**
- In a claim to show what the satellite saw on each date. A person drags the handle, or uses the arrow keys on the range input.

**What the consumer provides**
- Two `sat-layer` SVGs (`sat-before`, `sat-after`); the after layer is clipped with `clip-path: inset(0 0 0 var(--x))`.
- Two `sat-tag` pills with the date and source: "Before · 2 Feb 2026 · Sentinel-1".
- A real `<input type="range" class="sat-range" aria-label="Compare before and after">` and a few lines of script setting `--x` on `.sat`.
- A `sat-readings` row of `reading` chips: Flooded, Flood duration, Crop change (NDVI), Confidence as a pill (High `ok`, Medium `need`, Low `pending`).
- For Low confidence or "No flood detected", the line "Radar can miss water under dense rice. This does not close the claim."

**Do**
- Sweep the divider once from 100% to 50% on first reveal (1600ms `ease-in-out`); under reduced motion keep it at 50%.

**Don't**
- Show "No damage" as an end state.
- Put text on the imagery except the ink `sat-tag` pills.
