"use client";

import { useCallback, useState, type RefCallback } from "react";
import { isStill } from "./index";

// One IntersectionObserver for every motion hook, as system.js does: the element gets `in` once, when it first
// becomes visible (10% of it, 4% above the bottom edge). In still mode, or without IntersectionObserver, it is
// revealed at once.

type Listener = () => void;
let observer: IntersectionObserver | null = null;
const listeners = new WeakMap<Element, Listener>();

function shared(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        observer?.unobserve(e.target);
        listeners.get(e.target)?.();
        listeners.delete(e.target);
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -4% 0px" },
  );
  return observer;
}

/**
 * `const [ref, seen] = useReveal()`. Attach `ref` to the element and add the `in` class when `seen` is true.
 * Server render and first client render give `seen = false`, so the markup matches.
 */
export function useReveal<T extends Element = HTMLElement>(): [RefCallback<T>, boolean] {
  const [seen, setSeen] = useState(false);
  const ref = useCallback<RefCallback<T>>((el) => {
    if (!el) return;
    if (isStill() || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    listeners.set(el, () => setSeen(true));
    shared().observe(el);
    return () => {
      observer?.unobserve(el);
      listeners.delete(el);
    };
  }, []);
  return [ref, seen];
}
