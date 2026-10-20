"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { EASE_OUT, reducedMotion } from "@/lib/motion";

export interface DisclosureProps {
  /** The question or heading. */
  summary: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

/** `details.disc`: an accordion row whose body animates open and closed (instant with reduced motion). */
export function Disclosure({ summary, defaultOpen, className, children }: DisclosureProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const closing = useRef(false);

  const onSummaryClick = (e: MouseEvent<HTMLElement>) => {
    const d = details.current;
    const b = body.current;
    if (!d || !b || reducedMotion() || typeof b.animate !== "function") return; // native toggle, no motion
    e.preventDefault();
    const from = b.getBoundingClientRect().height;
    anim.current?.cancel();
    if (d.open && !closing.current) {
      closing.current = true;
      const a = b.animate([{ height: `${from}px` }, { height: "0px" }], { duration: 200, easing: EASE_OUT });
      anim.current = a;
      a.onfinish = () => {
        d.open = false;
        closing.current = false;
        anim.current = null;
      };
    } else {
      closing.current = false;
      d.open = true;
      const to = b.scrollHeight;
      const a = b.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 260, easing: EASE_OUT });
      anim.current = a;
      if (inner.current && from === 0) {
        inner.current.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }], {
          duration: 200,
          delay: 60,
          easing: EASE_OUT,
          fill: "backwards",
        });
      }
      a.onfinish = () => {
        anim.current = null;
      };
    }
  };

  return (
    <details ref={details} className={cx("disc", className)} open={defaultOpen || undefined}>
      <summary onClick={onSummaryClick}>{summary}</summary>
      <div className="disc-body" ref={body}>
        <div className="disc-inner" ref={inner}>
          {children}
        </div>
      </div>
    </details>
  );
}
