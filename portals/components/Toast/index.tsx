"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";
import { cx } from "@/lib/cx";
import { dismissToast, getServerToasts, getToasts, subscribeToasts, type ToastItem, type ToastTone } from "@/lib/toast";

export { toast, type ToastOptions, type ToastTone } from "@/lib/toast";

const TONE_ICON: Record<ToastTone, IconName> = { ok: "check", info: "info", need: "alert", alert: "rain-alert" };

export interface ToastViewProps {
  tone?: ToastTone;
  text: string;
  action?: { label: string; href: string };
  /** `in` is the settled, visible state. */
  state?: "in" | "out" | "pending";
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/** The toast markup on its own (the kitchen sink shows static ones). Live toasts come from `toast()`. */
export function ToastView({ tone = "ok", text, action, state = "in", onMouseEnter, onMouseLeave }: ToastViewProps) {
  return (
    <div className={cx("toast", state === "in" && "in", state === "out" && "out")} data-tone={tone} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Icon name={TONE_ICON[tone]} size="sm" />
      <span className="toast-text">{text}</span>
      {action ? (
        <a className="toast-action" href={action.href}>
          {action.label}
        </a>
      ) : null}
    </div>
  );
}

function LiveToast({ item }: { item: ToastItem }) {
  const [shown, setShown] = useState(false);
  const left = useRef(item.duration);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = item.id;
  const duration = item.duration;

  // Two frames before `in`, so the entry transition runs.
  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);

  const start = () => {
    if (duration <= 0 || item.leaving) return;
    startedAt.current = Date.now();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => dismissToast(id), left.current);
  };
  const pause = () => {
    if (!startedAt.current) return;
    clearTimeout(timer.current);
    left.current -= Date.now() - startedAt.current;
    startedAt.current = 0;
  };

  // 4 s on screen; paused while hovered or while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => (document.hidden ? pause() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer.current);
    };
    // start/pause only read refs and the stable id/duration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, duration]);

  return (
    <ToastView
      tone={item.tone}
      text={item.text}
      action={item.action}
      state={item.leaving ? "out" : shown ? "in" : "pending"}
      onMouseEnter={pause}
      onMouseLeave={start}
    />
  );
}

/** The live region that shows `toast()` messages: at most 3, newest at the bottom. Mounted once in app/layout.tsx. */
export function ToastRegion() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {items.map((t) => (
        <LiveToast key={t.id} item={t} />
      ))}
    </div>
  );
}
