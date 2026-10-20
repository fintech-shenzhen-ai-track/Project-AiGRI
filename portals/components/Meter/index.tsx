import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

export interface MeterProps {
  /** Fraction from 0 to 1. */
  value: number;
  /** Accessible description of the value, for example "62 percent". Leave out when the number is printed next to it. */
  label?: string;
  className?: string;
}

/** `.meter`: a progress or usage bar. The caller prints the number (formatted through the pack). */
export function Meter({ value, label, className }: MeterProps) {
  const p = Math.max(0, Math.min(1, value));
  return (
    <div className={cx("meter", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span style={{ "--p": p } as CSSProperties} />
    </div>
  );
}
