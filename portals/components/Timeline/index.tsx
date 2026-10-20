import type { CSSProperties, ReactNode } from "react";

export type TimelineState = "done" | "now" | "need" | "denied";

export interface TimelineItem {
  /** Date and time, formatted through the pack, or a word such as "Next". */
  when: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** Omit for a step that has not happened yet. */
  state?: TimelineState;
}

const STATE_CLASS: Record<TimelineState, string> = { done: "done", now: "is-now", need: "is-need", denied: "is-denied" };

export interface TimelineProps {
  items: TimelineItem[];
  /** How far the green line runs, 0..1. Default: up to the last item that has a state. */
  progress?: number;
}

/** `.tl`: the history of a claim, purchase or payout, newest state in ink. */
export function Timeline({ items, progress }: TimelineProps) {
  const last = items.reduce((acc, it, i) => (it.state ? i : acc), 0);
  const p = Math.round((progress ?? (items.length > 1 ? last / (items.length - 1) : 0)) * 1e4) / 1e4;
  return (
    <div className="tl" style={{ "--p": p } as CSSProperties}>
      <div className="tl-track">
        <span className="tl-fill" />
      </div>
      {items.map((it, i) => (
        <div key={i} className={`tl-item${it.state ? ` ${STATE_CLASS[it.state]}` : ""}`}>
          <span className="tl-pin" />
          <p className="tl-when">{it.when}</p>
          <p className="tl-title">{it.title}</p>
          {it.body ? <p className="tl-body">{it.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
