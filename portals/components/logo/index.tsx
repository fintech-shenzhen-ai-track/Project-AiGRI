import type { CSSProperties, Ref } from "react";

// Inline SVG logos from system-preview/PLAN.md 4.6. Never an <img src=".svg">. No insurer logos exist (Constitution X.2).

const GREEN = "#557945";
const INK = "#1F2A1B";
const SUN = "#FFCB3D";
const WHITE = "#FFFFFF";

type HorizontalVariant = "color" | "reversed";

/** Horizontal wordmark. `color` for light backgrounds (sidebar, 41px); `reversed` for the sign-in photo. */
export function LogoHorizontal({
  variant = "color",
  height = 41,
  title,
}: {
  variant?: HorizontalVariant;
  height?: number;
  /** Accessible name. Leave out when a parent link or role="img" already names it. */
  title?: string;
}) {
  const mark = variant === "color" ? GREEN : WHITE;
  const word = variant === "color" ? INK : WHITE;
  const dot = variant === "color" ? GREEN : SUN;
  return (
    <svg
      viewBox="0 0 756 256"
      height={height}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      focusable="false"
    >
      <path fill={mark} d="M72 76 H134.6 A64 64 0 0 0 180.1 120 H72 A16 16 0 0 1 56 104 V92 A16 16 0 0 1 72 76 Z" />
      <rect fill={mark} x="36" y="136" width="204" height="44" rx="16" />
      <rect fill={mark} x="16" y="196" width="224" height="44" rx="16" />
      <circle fill={SUN} cx="196" cy="58" r="46" />
      <g transform="translate(304 0)">
        <path fill={word} fillRule="evenodd" d="M15.85 188 L48 68 H72 L104.15 188 H81.37 L73.87 160 H46.13 L38.63 188 Z M60 108.3 L68.5 140 H51.5 Z" />
        <rect fill={word} x="130" y="116" width="22" height="72" />
        <path fill={dot} d="M124.27 85 A17 17 0 1 1 157.73 85 Z" />
        <path fill={dot} d="M155.4 91 A17 17 0 0 1 126.6 91 Z" />
        <path fill={word} d="M272.5 88.1 A62 62 0 1 0 287 128 L265 128 A40 40 0 1 1 255.6 102.3 Z" />
        <rect fill={word} x="243" y="117" width="44" height="22" />
        <path fill={word} fillRule="evenodd" d="M309 68 H357.5 A37.5 37.5 0 0 1 357.5 143 H331 V188 H309 Z M331 90 H357.5 A15.5 15.5 0 0 1 357.5 121 H331 Z" />
        <path fill={word} d="M348 143 H372 L397.98 188 H373.98 Z" />
        <rect fill={word} x="419" y="68" width="22" height="120" />
      </g>
    </svg>
  );
}

const ROW_STYLE = (r: number) => ({ "--r": r }) as CSSProperties;

/**
 * Symbol (cut row, two rows, sun). 32px in the mobile bar; 72px for sun-rise moments.
 * With `sunRise`, rows and sun carry the `sr-row` / `sr-sun` classes so the reveal animation can play (PLAN 4.6).
 */
export function LogoSymbol({
  size = 32,
  sunRise = false,
  className,
  title,
  ref,
}: {
  size?: number;
  sunRise?: boolean;
  className?: string;
  title?: string;
  /** For the reveal observer (SunRiseMark). */
  ref?: Ref<SVGSVGElement>;
}) {
  const rowClass = sunRise ? "sr-row" : undefined;
  const cls = [sunRise ? "sun-rise rv" : null, className].filter(Boolean).join(" ") || undefined;
  return (
    <svg
      ref={ref}
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={cls}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      focusable="false"
    >
      <path
        className={rowClass}
        style={sunRise ? ROW_STYLE(0) : undefined}
        fill={GREEN}
        d="M72 76 H134.6 A64 64 0 0 0 180.1 120 H72 A16 16 0 0 1 56 104 V92 A16 16 0 0 1 72 76 Z"
      />
      <rect className={rowClass} style={sunRise ? ROW_STYLE(1) : undefined} fill={GREEN} x="36" y="136" width="204" height="44" rx="16" />
      <rect className={rowClass} style={sunRise ? ROW_STYLE(2) : undefined} fill={GREEN} x="16" y="196" width="224" height="44" rx="16" />
      <circle className={sunRise ? "sr-sun" : undefined} fill={SUN} cx="196" cy="58" r="46" />
    </svg>
  );
}
