// Motion utilities (FR-03.3). Ports the boot, `AG.reduced()`, `tween` and easing helpers of
// system-preview/shared/system.js. The CSS does the animating; these decide *when*.
//
// Still mode (`?still` in the URL, or `html[data-still]`) freezes every motion in its final state. The
// `html.js` class and `data-still` are set by a tiny inline script in app/layout.tsx (MOTION_BOOT_SCRIPT) before
// first paint, exactly as system.js does at load, so that reveals render their final state on the server and
// animate only when scripting is on.

/** Inline script text for the document head. Adds `js` to <html> and `data-still` when the URL has `?still`. */
export const MOTION_BOOT_SCRIPT =
  "(function(){var d=document.documentElement;d.classList.add('js');if(/[?&]still(?:[=&]|$)/.test(location.search))d.setAttribute('data-still','')})()";

/** True when the page was opened with `?still` (or `html[data-still]` was set by a test). */
export function isStill(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-still");
}

/** True when the user asked the OS for reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Still mode or reduced motion: skip travel and count-ups, show final values. Same meaning as `AG.reduced()`. */
export function reducedMotion(): boolean {
  return isStill() || prefersReducedMotion();
}

export type Easing = (p: number) => number;

export const easeOut: Easing = (p) => 1 - Math.pow(1 - p, 4);
export const easeInOut: Easing = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** Run `step(eased)` on every frame for `ms`. Returns a function that stops it. */
export function tween(ms: number, ease: Easing, step: (eased: number) => void, done?: () => void): () => void {
  let t0: number | null = null;
  let stopped = false;
  let id = 0;
  const tick = (t: number) => {
    if (stopped) return;
    if (t0 === null) t0 = t;
    const p = Math.min(1, (t - t0) / ms);
    step(ease(p));
    if (p < 1) id = requestAnimationFrame(tick);
    else done?.();
  };
  id = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(id);
  };
}

/** The shared standard easing for WAAPI animations (DESIGN.md motion). */
export const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";
