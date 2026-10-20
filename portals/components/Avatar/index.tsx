import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

/** "Ibu Sri Wahyuni" -> "SW"; "Dimas Prasetyo" -> "DP". First letter of the first and last word. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const honorific = /^(ibu|bapak|pak|bu|mr|mrs|ms|dr)\.?$/i;
  const core = words.length > 2 && honorific.test(words[0] ?? "") ? words.slice(1) : words;
  const first = core[0]?.[0] ?? "";
  const last = core.length > 1 ? (core[core.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export interface AvatarProps {
  initials: string;
  /** Hide from assistive tech when the person's name is shown next to it. */
  decorative?: boolean;
  /** Accessible name when not decorative. */
  name?: string;
  white?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** `.avatar`: initials in a circle. */
export function Avatar({ initials, decorative, name, white, className, style }: AvatarProps) {
  return (
    <span
      className={cx("avatar", className)}
      style={white ? { background: "var(--white)", ...style } : style}
      aria-hidden={decorative || undefined}
      role={!decorative && name ? "img" : undefined}
      aria-label={!decorative ? name : undefined}
    >
      {initials}
    </span>
  );
}
