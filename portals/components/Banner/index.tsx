import type { HTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";
import { cx } from "@/lib/cx";

export type BannerTone = "ok" | "info" | "need" | "denied" | "alert";

const DEFAULT_ICON: Record<BannerTone, IconName> = { ok: "check", info: "info", need: "alert", denied: "x", alert: "rain-alert" };

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone;
  title: ReactNode;
  /** The solid alert version with white text: a live hazard on Home, used once. Only for `alert`. */
  strong?: boolean;
  icon?: IconName;
  /** Buttons or a link, on the right (stacked on mobile). */
  actions?: ReactNode;
  children?: ReactNode;
}

/** `.banner`: a status message. Enters with the standard reveal and is never animated again. */
export function Banner({ tone = "info", title, strong, icon, actions, children, className, ...rest }: BannerProps) {
  return (
    <div className={cx("banner", `banner-${tone}`, strong && "is-strong", className)} {...rest}>
      <span className="banner-icon">
        <Icon name={icon ?? DEFAULT_ICON[tone]} />
      </span>
      <p className="banner-title">{title}</p>
      {children ? <p className="banner-text">{children}</p> : null}
      {actions ? <div className="banner-actions">{actions}</div> : null}
    </div>
  );
}
