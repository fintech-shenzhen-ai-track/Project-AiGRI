"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Button } from "@/components/Button";
import { cx } from "@/lib/cx";
import { EASE_OUT, reducedMotion } from "@/lib/motion";

// Multi-step flows (onboarding, claim packet, purchase): `<Flow>` holds the current step, `<Stepper>` shows it,
// `<FlowStep n>` is one panel, and `useFlow()` gives the buttons `next`, `prev` and `go`. Port of `AG.flow`.

interface FlowCtx {
  step: number;
  total: number;
  labels: string[];
  userDriven: boolean;
  go: (n: number) => void;
  next: () => void;
  prev: () => void;
}
const FlowContext = createContext<FlowCtx | null>(null);

export function useFlow(): FlowCtx {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow() must be used inside <Flow>");
  return ctx;
}

export interface FlowProps {
  /** Step names, in order. Their count is the number of steps. */
  steps: string[];
  /** First step, 1-based. Default 1. */
  start?: number;
  /** Controlled step, 1-based. */
  step?: number;
  onStepChange?: (step: number) => void;
  className?: string;
  children: ReactNode;
}

export function Flow({ steps, start = 1, step, onStepChange, className, children }: FlowProps) {
  const total = steps.length;
  const clamp = useCallback((n: number) => Math.max(1, Math.min(total, Math.round(n) || 1)), [total]);
  const [inner, setInner] = useState(clamp(start));
  const [userDriven, setUserDriven] = useState(false);
  const current = clamp(step ?? inner);

  const go = useCallback(
    (n: number) => {
      const next = clamp(n);
      setUserDriven(true);
      if (step === undefined) setInner(next);
      onStepChange?.(next);
    },
    [clamp, step, onStepChange],
  );

  const value = useMemo<FlowCtx>(
    () => ({ step: current, total, labels: steps, userDriven, go, next: () => go(current + 1), prev: () => go(current - 1) }),
    [current, total, steps, userDriven, go],
  );

  return (
    <FlowContext.Provider value={value}>
      <div className={cx("flow", className)}>{children}</div>
    </FlowContext.Provider>
  );
}

/** The step dots and line. On a phone it collapses to "Step 2 of 4 · What you farm" with a meter. */
export function Stepper() {
  const { step, total, labels } = useFlow();
  const p = total > 1 ? Math.round(((step - 1) / (total - 1)) * 1e4) / 1e4 : 0;
  const style = { "--n": total, "--p": p } as CSSProperties;
  return (
    <>
      <div className="stepper" style={style} role="list">
        <div className="stepper-track">
          <span className="stepper-fill" />
        </div>
        {labels.map((label, i) => (
          <div
            key={label}
            className={cx("step", i + 1 < step && "is-done", i + 1 === step && "is-now")}
            role="listitem"
            aria-current={i + 1 === step ? "step" : undefined}
          >
            <span className="step-dot">{i + 1}</span>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="stepper-compact">
        <span className="sc-text">
          {`Step ${step} of ${total}`}
          {labels[step - 1] ? ` · ${labels[step - 1]}` : ""}
        </span>
        <div className="meter" aria-hidden="true">
          <span style={{ "--p": Math.round((step / total) * 1e4) / 1e4 } as CSSProperties} />
        </div>
      </div>
    </>
  );
}

export interface FlowStepProps {
  /** 1-based. */
  n: number;
  className?: string;
  children: ReactNode;
}

/** One panel. Only the current step shows. When a person moves between steps, focus goes to its heading. */
export function FlowStep({ n, className, children }: FlowStepProps) {
  const { step, userDriven } = useFlow();
  const active = step === n;
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node || !active || !userDriven) return;
    const h = node.querySelector<HTMLElement>("[data-flow-focus], h1, h2, h3");
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
    if (typeof node.animate === "function") {
      if (reducedMotion()) node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      else node.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: EASE_OUT });
    }
  }, [active, userDriven]);

  return (
    <div ref={el} className={cx(className, active && "is-active")} data-flow-step={n}>
      {children}
    </div>
  );
}

/** Back and Continue buttons wired to the flow. Back is hidden on the first step; Continue is replaced by `finish` on the last. */
export function FlowControls({ back = "Back", next = "Continue", finish }: { back?: string; next?: string; finish?: ReactNode }) {
  const f = useFlow();
  return (
    <div className="row">
      {f.step > 1 ? (
        <Button variant="soft" onClick={f.prev}>
          {back}
        </Button>
      ) : null}
      {f.step < f.total ? <Button onClick={f.next}>{next}</Button> : finish}
    </div>
  );
}
