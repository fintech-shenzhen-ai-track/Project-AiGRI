"use client";

import { createElement, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { useReveal } from "@/lib/motion/use-reveal";

type Kind = "rv" | "pop" | "settle";

interface RevealProps {
  /** Element to render. Default `div`. */
  as?: ElementType;
  /** `rv` rises and fades in (default), `pop` scales in (pills), `settle` eases a photo from 1.06 to 1. */
  kind?: Kind;
  /** Stagger index for `rv`: delay is `i * 40ms`. */
  i?: number;
  /** Delay for `pop`, in ms. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [attr: string]: unknown;
}

/**
 * Reveal on scroll (`.rv`, `.pop`, `.settle`). Renders its final state on the server; the stylesheet only hides it
 * when `html.js` is set, and still mode or reduced motion shows it at once. Replaces `<el class="rv" style="--i:n">`.
 */
export function Reveal({ as = "div", kind = "rv", i, delay, className, style, children, ...rest }: RevealProps) {
  const [ref, seen] = useReveal();
  const vars: Record<string, string | number> = {};
  if (i !== undefined) vars["--i"] = i;
  if (delay !== undefined) vars["--d"] = `${delay}ms`;
  return createElement(
    as,
    { ...rest, ref, className: cx(className, kind, seen && "in"), style: { ...vars, ...style } },
    children,
  );
}
