"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";
import { easeOut, reducedMotion, tween } from "@/lib/motion";
import { useReveal } from "@/lib/motion/use-reveal";

export interface CountUpProps {
  /** Final value, in the unit `format` expects (money: major units). */
  to: number;
  from?: number;
  /** Turns a number into text through the pack, for example `(v) => f.moneyMajor(Math.round(v))`. */
  format: (value: number) => string;
  /** Milliseconds. Default 900 (`--dur-count`). */
  duration?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * A number that counts up when it first scrolls into view. The server renders the final value, so the figure is
 * right without scripting, in still mode and with reduced motion. Use it only when a figure has just changed
 * (a payout arrived), not on every number (DESIGN.md motion).
 */
export function CountUp({ to, from = 0, format, duration = 900, as = "span", className, style, title }: CountUpProps) {
  const [text, setText] = useState(() => format(to));
  const [revealRef, seen] = useReveal<HTMLElement>();
  const fmt = useRef(format);
  const shown = useRef(to);
  useEffect(() => {
    fmt.current = format;
  });

  // Before the reveal, show the start value (only if the animation will play).
  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (el && !reducedMotion()) {
        shown.current = from;
        setText(fmt.current(from));
      }
      return revealRef(el);
    },
    [revealRef, from],
  );

  useEffect(() => {
    if (!seen) return;
    if (reducedMotion()) {
      // No travel: show the new value on the next frame.
      shown.current = to;
      const id = requestAnimationFrame(() => setText(fmt.current(to)));
      return () => cancelAnimationFrame(id);
    }
    const start = shown.current;
    return tween(
      duration,
      easeOut,
      (e) => {
        const v = start + (to - start) * e;
        shown.current = v;
        setText(fmt.current(v));
      },
      () => setText(fmt.current(to)),
    );
  }, [seen, to, duration]);

  const Tag = as;
  return (
    <Tag ref={ref} className={className} style={style} title={title}>
      {text}
    </Tag>
  );
}
