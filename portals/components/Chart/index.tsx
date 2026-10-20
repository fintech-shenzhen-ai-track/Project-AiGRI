"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { cx } from "@/lib/cx";
import { useReveal } from "@/lib/motion/use-reveal";

// Charts (FR-03.2, DESIGN.md 9.12): bars, line + area, stacked bar, sparkline, a threshold line, and "Show as
// table". Charts draw what they are given: values arrive as numbers for geometry and as pre-formatted strings
// (through the pack) for labels, so no unit or symbol is printed here. Every chart is `role="img"` with an
// `aria-label` summary and should be followed by a <ShowAsTable>.

const W = 420;
const BASE = 180; // baseline y
const PLOT_H = 140; // tallest bar / highest line point above the baseline
const AXIS_Y = 204;

export type BarTone = "risk" | "water" | "ink";

export interface BarDatum {
  label: string;
  value: number;
  /** Formatted value printed above the bar, for example "31%". */
  display: string;
  /** Default leaf green. `risk` is the parcel-risk orange (hazard), `water` the flood blue, `ink` for emphasis. */
  tone?: BarTone;
}

export interface BarChartProps {
  data: BarDatum[];
  "aria-label": string;
  /** Value that fills the full height. Default: the largest value. */
  max?: number;
  className?: string;
}

/** Vertical bars with direct value labels. Bars grow from the baseline once, on reveal. */
export function BarChart({ data, "aria-label": ariaLabel, max, className }: BarChartProps) {
  const [ref, seen] = useReveal<SVGSVGElement>();
  const n = data.length;
  const top = max ?? Math.max(...data.map((d) => d.value), 0);
  const step = n <= 6 ? 70 : 410 / n;
  const barW = n <= 6 ? 44 : Math.round(step * 0.63);
  return (
    <svg ref={ref} className={cx("chart", seen && "in", className)} data-draw viewBox={`0 0 ${W} 220`} role="img" aria-label={ariaLabel}>
      <line className="axis" x1="0" y1={BASE} x2={W} y2={BASE} />
      {data.map((d, i) => {
        const h = top > 0 ? Math.round((Math.max(0, d.value) / top) * PLOT_H) : 0;
        const x = Math.round(10 + step * i);
        const cx0 = x + barW / 2;
        const style = { "--i": i } as CSSProperties;
        return (
          <g key={`${d.label}-${i}`}>
            <rect className={cx("bar", d.tone && `is-${d.tone}`, "draw-bar")} style={style} x={x} y={BASE - h} width={barW} height={h} rx="6" />
            <text className="bar-label" style={style} x={cx0} y={BASE - h - 10}>
              {d.display}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={`ax-${d.label}-${i}`} className="axis" x={Math.round(10 + step * i) + barW / 2} y={AXIS_Y}>
          {d.label}
        </text>
      ))}
    </svg>
  );
}

export interface LineChartProps {
  /** One value per point, evenly spaced across the width. */
  values: number[];
  /** Value at the top of the plot. Default: the largest value, or the threshold if higher. */
  yMax?: number;
  /** A reference level, drawn as a 2px alert line with a label ("BMKG heavy-rain level 50 mm/day", from the pack and data). */
  threshold?: { value: number; label: string };
  /** x-axis ticks: `index` into `values` and the printed `label`. */
  xTicks: { index: number; label: string }[];
  tone?: "water" | "leaf";
  "aria-label": string;
  className?: string;
}

/** A line with a soft area under it. The line draws once on reveal. */
export function LineChart({ values, yMax, threshold, xTicks, tone = "water", "aria-label": ariaLabel, className }: LineChartProps) {
  const [ref, seen] = useReveal<SVGSVGElement>();
  const n = values.length;
  const top = yMax ?? Math.max(...values, threshold?.value ?? 0, 1);
  const pts = values.map((v, i) => {
    const x = n > 1 ? Math.round((i * W) / (n - 1)) : 0;
    const y = Math.round(BASE - (Math.max(0, v) / top) * PLOT_H);
    return `${x} ${y}`;
  });
  const lastX = n > 1 ? W : 0;
  const line = `M${pts.join(" ")}`;
  const area = `M0 ${BASE} ${pts.join(" ")} ${lastX} ${BASE}Z`;
  const ty = threshold ? Math.round(BASE - (threshold.value / top) * PLOT_H) : 0;
  const tint = tone === "water" ? " is-water" : "";
  return (
    <svg ref={ref} className={cx("chart", seen && "in", className)} data-draw viewBox={`0 0 ${W} 220`} role="img" aria-label={ariaLabel}>
      <line className="axis" x1="0" y1={BASE} x2={W} y2={BASE} />
      {threshold ? (
        <>
          <line className="threshold" x1="0" y1={ty} x2={W} y2={ty} />
          <text className="threshold" x="0" y={ty - 10}>
            {threshold.label}
          </text>
        </>
      ) : null}
      <path className={`area${tint}`} d={area} />
      <path className={`line${tint} draw-line`} pathLength="1" d={line} />
      {xTicks.map((t) => {
        const x = n > 1 ? (t.index * W) / (n - 1) : 0;
        return (
          <text key={`${t.index}-${t.label}`} className="axis" x={Math.round(Math.min(W - 14, Math.max(14, x)))} y={AXIS_Y}>
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

export type StackTone = "neutral" | "info" | "ink" | "need" | "ok" | "denied" | "alert";

const STACK_FILL: Record<StackTone, string> = {
  neutral: "var(--track)",
  info: "var(--info)",
  ink: "var(--ink)",
  need: "var(--need)",
  ok: "var(--leaf)",
  denied: "var(--denied)",
  alert: "var(--alert)",
};

export interface StackSegment {
  label: string;
  value: number;
  /** Formatted count printed in the legend. */
  display: string;
  tone: StackTone;
}

export interface StackedBarChartProps {
  segments: StackSegment[];
  "aria-label": string;
  className?: string;
}

/** One horizontal bar split into segments (claims by status), with a legend of labelled counts under it. */
export function StackedBarChart({ segments, "aria-label": ariaLabel, className }: StackedBarChartProps) {
  const [ref, seen] = useReveal<SVGSVGElement>();
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const gap = 2;
  const barH = 28;
  const widths = segments.map((s) => (total > 0 ? (Math.max(0, s.value) / total) * W : 0));
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((acc, w) => acc + w, 0));
  return (
    <div className={className}>
      <svg ref={ref} className={cx("chart", seen && "in")} data-draw viewBox={`0 0 ${W} ${barH}`} role="img" aria-label={ariaLabel}>
        {segments.map((s, i) => (
          <rect
            key={`${s.label}-${i}`}
            className="draw-bar"
            style={{ "--i": i, transformOrigin: "0 50%", transformBox: "fill-box" } as CSSProperties}
            x={starts[i]}
            y="0"
            width={Math.max(0, (widths[i] ?? 0) - (i < segments.length - 1 ? gap : 0))}
            height={barH}
            rx="8"
            fill={STACK_FILL[s.tone]}
          />
        ))}
      </svg>
      <div className="legend" style={{ marginTop: 12 }}>
        {segments.map((s, i) => (
          <span key={`${s.label}-${i}`}>
            <i className="swatch" style={{ "--c": STACK_FILL[s.tone] } as CSSProperties} />
            {s.label} {s.display}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface SparklineProps {
  values: number[];
  tone?: "leaf";
  className?: string;
}

/** `svg.spark`: a tiny trend line inside a Stat. Decorative; the Stat carries the number. */
export function Sparkline({ values, className }: SparklineProps) {
  const n = values.length;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => `${Math.round(2 + (116 * i) / Math.max(1, n - 1))} ${Math.round(24 - ((v - lo) / span) * 18)}`);
  return (
    <svg className={cx("spark", className)} viewBox="0 0 120 32" aria-hidden="true" preserveAspectRatio="none">
      <path d={`M${pts.join(" ")}`} fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface ShowAsTableProps {
  /** Column headers; the first column is the label. */
  headers: string[];
  /** Rows of already formatted strings. */
  rows: string[][];
  className?: string;
}

/** The "Show as table" ghost button and the table it reveals: the accessible twin of a chart. */
export function ShowAsTable({ headers, rows, className }: ShowAsTableProps): ReactNode {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" aria-expanded={open} aria-controls={id} style={{ marginTop: 8 }} className={className} onClick={() => setOpen((o) => !o)}>
        Show as table
      </Button>
      <table className="table chart-table" id={id} hidden={!open}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={h} scope="col" className={i > 0 ? "r" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={ci === 0 ? "id" : "num"}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
