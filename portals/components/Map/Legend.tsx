import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface LegendItem {
  label: ReactNode;
  /** A design token name without `--` ("parcel", "parcel-risk", "parcel-off", "water", "map-water") or any CSS colour. */
  color: string;
}

const colorOf = (c: string) => (/^[a-z][a-z0-9-]*$/.test(c) ? `var(--${c})` : c);

/** `.legend`: solid swatches with labels, under or over a map. */
export function Legend({ items, className, style }: { items: LegendItem[]; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("legend", className)} style={style}>
      {items.map((it, i) => (
        <span key={i}>
          <i className="swatch" style={{ "--c": colorOf(it.color) } as CSSProperties} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** `.map-label` as a pin: a white pill with a place name, positioned absolutely inside `.map`. */
export function MapLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span className="map-label is-pin" style={style}>
      {children}
    </span>
  );
}
