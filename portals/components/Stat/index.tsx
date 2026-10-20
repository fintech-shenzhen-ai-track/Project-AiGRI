import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface StatProps {
  label: ReactNode;
  /** The number, already formatted through the pack. */
  value: ReactNode;
  /** Full value for hover and assistive tech when `value` is compact (for example the whole rupiah amount). */
  valueTitle?: string;
  meta?: ReactNode;
  /** A sparkline or a Meter under the figure. */
  children?: ReactNode;
  className?: string;
}

/** `.stat`: a KPI tile. */
export function Stat({ label, value, valueTitle, meta, children, className }: StatProps) {
  return (
    <div className={cx("stat", className)}>
      <span className="label">{label}</span>
      <span className="num-l" title={valueTitle}>
        {value}
      </span>
      {meta ? <span className="meta">{meta}</span> : null}
      {children}
    </div>
  );
}
