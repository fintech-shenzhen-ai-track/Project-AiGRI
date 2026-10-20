import type { SVGProps } from "react";
import { ICON_NAMES, ICON_PATHS, type IconName } from "./paths";

export { ICON_NAMES, type IconName };

/**
 * The icon sprite: one hidden <svg> with a <symbol id="i-NAME"> per icon (PLAN 4.3). Render it once,
 * as the first child of <body> (app/layout.tsx). Markup matches what system.js injects in the prototype.
 */
export function IconSprite() {
  return (
    <svg id="ag-sprite" width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        {ICON_NAMES.map((name) => (
          <symbol
            key={name}
            id={`i-${name}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            // Static, trusted markup from paths.ts (no user input).
            dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
          />
        ))}
      </defs>
    </svg>
  );
}

type IconSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<IconSize, string> = { sm: " i-sm", md: "", lg: " i-lg" };

/** `<Icon name="bell" />` renders `<svg class="i" aria-hidden="true"><use href="#i-bell"/></svg>`. */
export function Icon({
  name,
  size = "md",
  className,
  ...rest
}: { name: IconName; size?: IconSize; className?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg className={`i${SIZE_CLASS[size]}${className ? ` ${className}` : ""}`} aria-hidden="true" focusable="false" {...rest}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
