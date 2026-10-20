// Toast store (FR-03.3, port of `AG.toast`). `toast("Saved.")` can be called from anywhere on the client;
// the <ToastRegion /> mounted in app/layout.tsx renders what is in here. Rules from system.js: at most 3 live
// toasts (the oldest leaves when a 4th arrives), 4 s on screen, paused while hovered or while the tab is hidden.

import { isStill } from "./motion";

export type ToastTone = "ok" | "info" | "need" | "alert";

export interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds on screen. 0 keeps it until dismissed. Default 4000. */
  duration?: number;
  action?: { label: string; href: string };
}

export interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
  duration: number;
  action?: { label: string; href: string };
  /** True while the exit animation runs. */
  leaving: boolean;
}

export const MAX_TOASTS = 3;
export const DEFAULT_TOAST_MS = 4000;
/** Exit animation length (`--dur-exit`). */
const EXIT_MS = 200;

let items: ToastItem[] = [];
let nextId = 1;
const subscribers = new Set<() => void>();

function emit(next: ToastItem[]) {
  items = next;
  subscribers.forEach((fn) => fn());
}

export function subscribeToasts(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function getToasts(): ToastItem[] {
  return items;
}

const SERVER_SNAPSHOT: ToastItem[] = [];
export function getServerToasts(): ToastItem[] {
  return SERVER_SNAPSHOT;
}

/** Start the exit animation for a toast, then remove it. */
export function dismissToast(id: number): void {
  const t = items.find((x) => x.id === id);
  if (!t || t.leaving) return;
  emit(items.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
  const remove = () => emit(items.filter((x) => x.id !== id));
  if (isStill()) remove();
  else setTimeout(remove, EXIT_MS);
}

/** Show a toast. Returns its id. */
export function toast(text: string, options: ToastOptions = {}): number {
  const live = items.filter((x) => !x.leaving);
  while (live.length >= MAX_TOASTS) {
    const oldest = live.shift();
    if (oldest) dismissToast(oldest.id);
  }
  const item: ToastItem = {
    id: nextId++,
    text,
    tone: options.tone ?? "ok",
    duration: options.duration ?? DEFAULT_TOAST_MS,
    action: options.action,
    leaving: false,
  };
  emit([...items, item]);
  return item.id;
}

/** For tests: drop everything without animating. */
export function clearToasts(): void {
  emit([]);
}
