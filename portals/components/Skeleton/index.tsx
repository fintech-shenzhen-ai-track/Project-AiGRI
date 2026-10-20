import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

export interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  marginTop?: number | string;
  className?: string;
}

/**
 * `.skel`: a placeholder block. Put the skeletons inside a container with `aria-busy="true"` so they breathe and
 * assistive tech knows content is loading. Shapes should match the content that will replace them.
 */
export function Skeleton({ height, width, marginTop, className }: SkeletonProps) {
  const style: CSSProperties = { height, width, marginTop };
  return <span className={cx("skel", className)} style={style} />;
}
