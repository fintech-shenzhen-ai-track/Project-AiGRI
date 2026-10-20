import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children" | "role">;

/**
 * `.switch`: an on/off toggle with a visible label. Without `children` it renders just the switch and
 * `aria-label` must be given.
 */
export function Switch({ children, className, ...rest }: Native & { children?: ReactNode }) {
  const control = (
    <span className="switch">
      <input type="checkbox" role="switch" {...rest} />
      <span className="switch-ui" />
    </span>
  );
  if (children === undefined) return control;
  return (
    <label className={cx("row", className)} style={{ gap: 12 }}>
      {control}
      {children}
    </label>
  );
}
