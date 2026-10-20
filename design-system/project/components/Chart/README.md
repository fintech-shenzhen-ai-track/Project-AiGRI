Charts are inline SVGs (`svg.chart`) that show a few numbers directly: bars, a line with area, a stacked bar or a sparkline.

**When to use**
- Loss probability by parcel (bars), rain forecast in mm per day (line with area), claims by status (stacked horizontal bar), a KPI trend (sparkline).

**What the consumer provides**
- `role="img"` and an `aria-label` that summarises the numbers, plus a "Show as table" `btn-ghost` that reveals a `table.chart-table` with the same data.
- A 2px `track` baseline (`line.axis`), value labels on bars (`bar-label`, 15px tabular), ticks at 13px (`text.axis`, `muted-2`, on white or `surface-2` cards only for graphics).
- Series colours in this order: `leaf` (default `bar`), `water` (`is-water`), `ink` (`is-ink`), `parcel-risk` (`is-risk`). At most four series.
- A threshold as `line.threshold` in `alert`, 2px, with a label ("BMKG heavy-rain level 50 mm/day").

**Do**
- Draw bars from the baseline once (`scaleY`, 600ms, 30ms stagger) and lines with `stroke-dashoffset` (900ms); under reduced motion fade for 300ms.
- Label values directly.

**Don't**
- Add gridlines, axis boxes or a fifth series.
- Use `sun` in a chart.
