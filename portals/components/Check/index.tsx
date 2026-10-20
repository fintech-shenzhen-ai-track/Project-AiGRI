import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children">;

/** `.check`: checkbox with the AiGRI box. The label text is the children. */
export function Check({ children, className, ...rest }: Native & { children: ReactNode }) {
  return (
    <label className={cx("check", className)}>
      <input type="checkbox" {...rest} />
      <span className="check-box" />
      <span>{children}</span>
    </label>
  );
}

/** `.radio`: radio with the AiGRI dot. Give radios in a group the same `name`. */
export function Radio({ children, className, ...rest }: Native & { children: ReactNode }) {
  return (
    <label className={cx("radio", className)}>
      <input type="radio" {...rest} />
      <span className="radio-box" />
      <span>{children}</span>
    </label>
  );
}
