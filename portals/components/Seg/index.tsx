"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface SegOption {
  value: string;
  label: ReactNode;
}

export interface SegProps {
  options: SegOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label": string;
  className?: string;
}

/** `.seg`: segmented control with a sliding thumb. Port of `[data-seg]`. */
export function Seg({ options, value, defaultValue, onValueChange, className, "aria-label": ariaLabel }: SegProps) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? inner;
  const root = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  // The first placement (and any after a resize or font load) jumps; later moves slide.
  const [animated, setAnimated] = useState(false);

  const place = useCallback(() => {
    const btn = root.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (btn) setThumb({ x: btn.offsetLeft - 4, w: btn.offsetWidth });
  }, []);

  useLayoutEffect(place, [place, current, options]);

  useEffect(() => {
    let id = requestAnimationFrame(() => setAnimated(true));
    const relayout = () => {
      cancelAnimationFrame(id);
      setAnimated(false);
      place();
      id = requestAnimationFrame(() => setAnimated(true));
    };
    window.addEventListener("resize", relayout);
    void document.fonts?.ready.then(relayout);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", relayout);
    };
  }, [place]);

  return (
    <div ref={root} className={cx("seg", thumb && "has-thumb", className)} role="group" aria-label={ariaLabel}>
      <span
        className="seg-thumb"
        style={thumb ? { width: thumb.w, transform: `translateX(${thumb.x}px)`, transition: animated ? undefined : "none" } : undefined}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-value={o.value}
          aria-pressed={o.value === current}
          onClick={() => {
            if (value === undefined) setInner(o.value);
            onValueChange?.(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
