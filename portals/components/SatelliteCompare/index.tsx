"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { easeInOut, reducedMotion, tween } from "@/lib/motion";
import { useReveal } from "@/lib/motion/use-reveal";

export interface SatelliteCompareProps {
  /** The "before" picture: an SVG scene or an <img> that fills the frame. */
  before: ReactNode;
  after: ReactNode;
  /** "Before · 2 Feb 2026 · Sentinel-1", dates and source formatted by the caller. */
  beforeTag: string;
  afterTag: string;
  /** Accessible name of the slider. */
  label?: string;
  className?: string;
}

/**
 * `.sat`: before and after of a parcel with a draggable divider (`<input type="range">`, so the arrow keys work).
 * When first revealed the divider sweeps once from the right edge to the middle (1.6 s); with reduced motion, or
 * once the person touches it, it stays put. This is evidence for the Adjuster, never a decision (Constitution V).
 */
export function SatelliteCompare({ before, after, beforeTag, afterTag, label = "Compare before and after", className }: SatelliteCompareProps) {
  const [x, setX] = useState(50);
  const touched = useRef(false);
  const [revealRef, seen] = useReveal<HTMLDivElement>();

  // Start with the divider at the right edge when the sweep will play.
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && !reducedMotion()) setX(100);
      return revealRef(el);
    },
    [revealRef],
  );

  useEffect(() => {
    if (!seen || reducedMotion()) return;
    return tween(1600, easeInOut, (e) => {
      if (!touched.current) setX(100 - 50 * e);
    });
  }, [seen]);

  return (
    <div ref={ref} className={cx("sat", seen && "in", className)} style={{ "--x": `${x}%` } as CSSProperties}>
      <div className="sat-layer sat-before">{before}</div>
      <div className="sat-layer sat-after">{after}</div>
      <span className="sat-tag is-before">{beforeTag}</span>
      <span className="sat-tag is-after">{afterTag}</span>
      <span className="sat-handle" aria-hidden="true" />
      <input
        className="sat-range"
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(x)}
        aria-label={label}
        onChange={(e) => {
          touched.current = true;
          setX(Number(e.target.value));
        }}
      />
    </div>
  );
}

export interface Reading {
  label: ReactNode;
  /** A string is printed in bold; pass an element (a `<StatusPill>`) to use it as is. */
  value: ReactNode;
}

export const RADAR_NOTE = "Radar can miss water under dense rice. This does not close the claim.";

/**
 * `.sat-readings`: the figures under the frame (flooded share, duration, crop change, confidence).
 * Set `lowReading` for a Low confidence or "No flood detected" result: the radar note is then always shown.
 */
export function SatReadings({ readings, lowReading }: { readings: Reading[]; lowReading?: boolean }) {
  return (
    <>
      <div className="sat-readings">
        {readings.map((r, i) => (
          <div className="reading" key={i}>
            <span className="label">{r.label}</span>
            {typeof r.value === "string" || typeof r.value === "number" ? <b>{r.value}</b> : r.value}
          </div>
        ))}
      </div>
      {lowReading ? (
        <p className="meta" style={{ marginTop: 8 }}>
          {RADAR_NOTE}
        </p>
      ) : null}
    </>
  );
}
