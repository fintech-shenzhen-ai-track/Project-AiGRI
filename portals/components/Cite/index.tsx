import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * `.cite`: a clause chip such as "Clause 4.1". Every coverage statement carries one, or says "Not stated in this
 * policy" (Constitution II). Normally a button that opens the clause in a Sheet.
 */
export function Cite({ children, className, ...rest }: (ButtonProps | LinkProps) & { children: ReactNode }) {
  if ("href" in rest && rest.href !== undefined) {
    return (
      <a className={cx("cite", className)} {...(rest as LinkProps)}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cx("cite", className)} {...(rest as ButtonProps)}>
      {children}
    </button>
  );
}
