import { cx } from "@/lib/cx";

/**
 * `.ins-mark`: the insurer's initials in a tile. No insurer logos exist in AiGRI (Constitution X.2); the initials
 * come from the country pack (`insurers[].initials`).
 */
export function InsMark({ initials, name, className }: { initials: string; name?: string; className?: string }) {
  return (
    <span className={cx("ins-mark", className)} role={name ? "img" : undefined} aria-label={name} aria-hidden={name ? undefined : true}>
      {initials}
    </span>
  );
}
