import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "@/components/icons/sprite";

export type ButtonVariant = "y" | "ink" | "soft" | "ghost" | "danger" | "w";
export type ButtonSize = "sm" | "md" | "lg";

interface Look {
  /** `y` is the yellow commitment button: at most one per view or open dialog (DESIGN.md, Constitution XI). */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width (`btn-block`). */
  block?: boolean;
  /** Leading icon from the sprite. */
  icon?: IconName;
  children?: ReactNode;
  className?: string;
}

function look({ variant = "ink", size = "md", block, className }: Look, extra?: string): string {
  return cx("btn", `btn-${variant}`, size !== "md" && `btn-${size}`, block && "btn-block", extra, className);
}

export interface ButtonProps extends Look, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  /** Shows the three-dot loader; the button ignores clicks while it is on. */
  loading?: boolean;
}

/** `.btn` as a `<button>`. Default variant is `ink`. */
export function Button({ variant, size, block, icon, loading, className, children, type = "button", onClick, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={look({ variant, size, block, className }, loading ? "is-loading" : undefined)}
      aria-busy={loading || undefined}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends Look, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> {
  href: string;
}

/** `.btn` as a link (navigation). Internal paths use the Next.js router. */
export function ButtonLink({ variant, size, block, icon, className, children, href, ...rest }: ButtonLinkProps) {
  const external = /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
  const content = (
    <>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </>
  );
  const cls = look({ variant, size, block, className });
  return external || href.startsWith("#") ? (
    <a className={cls} href={href} {...rest}>
      {content}
    </a>
  ) : (
    <Link className={cls} href={href} {...rest}>
      {content}
    </Link>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  /** Required: an icon button has no visible text. Include state, for example "Alerts, 1 new". */
  label: string;
  /** Small alert dot at the top right (unread). */
  dot?: boolean;
  small?: boolean;
}

/** `.icon-btn`, 44px target. */
export function IconButton({ icon, label, dot, small, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx("icon-btn", className)} aria-label={label} {...rest}>
      <Icon name={icon} size={small ? "sm" : "md"} />
      {dot ? <span className="dot" /> : null}
    </button>
  );
}

export interface IconLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> {
  icon: IconName;
  label: string;
  href: string;
  dot?: boolean;
}

/** `.icon-btn` as a link, for example the bell in the top bar. */
export function IconLink({ icon, label, href, dot, className, ...rest }: IconLinkProps) {
  const cls = cx("icon-btn", className);
  const inner = (
    <>
      <Icon name={icon} />
      {dot ? <span className="dot" /> : null}
    </>
  );
  return href.startsWith("#") ? (
    <a className={cls} href={href} aria-label={label} {...rest}>
      {inner}
    </a>
  ) : (
    <Link className={cls} href={href} aria-label={label} {...rest}>
      {inner}
    </Link>
  );
}
