import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export const DEMO_NOTE_TEXT = "Demo data. Products and prices are illustrative.";

/** `.demo-note`: on every screen that shows policies or fixture evidence (Constitution X.2). */
export function DemoNote({ children = DEMO_NOTE_TEXT, className }: { children?: ReactNode; className?: string }) {
  return <p className={cx("demo-note", className)}>{children}</p>;
}
