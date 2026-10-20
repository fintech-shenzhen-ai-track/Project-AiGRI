"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { IconButton } from "@/components/Button";
import { cx } from "@/lib/cx";
import { isStill, prefersReducedMotion } from "@/lib/motion";

// Shared engine behind Modal and Sheet: a native <dialog> opened with showModal(), so the browser traps focus,
// makes the page inert and handles Esc. This adds what system.js adds: the `has-dialog` scroll lock on <html>,
// the `is-open` class one frame after opening (so the CSS transition runs), backdrop click to close, first-field
// focus, and returning focus to whatever opened it. Port of `AG.open` and `AG.close`.

const CloseContext = createContext<(() => void) | null>(null);

/** Inside a Modal or Sheet: returns a function that closes it. For footer buttons. */
export function useDialogClose(): () => void {
  const close = useContext(CloseContext);
  if (!close) throw new Error("useDialogClose() must be used inside a Modal or Sheet");
  return close;
}

/** State for a Modal or Sheet: `<Sheet {...d.props} />` and `<Button onClick={d.show}>`. */
export function useDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  return { open, show, hide, setOpen, props: { open, onOpenChange: setOpen } };
}

export interface DialogProps {
  kind: "modal" | "sheet";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Buttons. In a Modal the yellow button, if any, is the commitment (one per open dialog). */
  footer?: ReactNode;
  children?: ReactNode;
  /** Accessible name for the close button of a Sheet. */
  closeLabel?: string;
  /** Render in place, already open, without the overlay (kitchen sink previews). */
  preview?: boolean;
  /** Accessible name of a preview. */
  previewLabel?: string;
}

const FOCUS_FIRST = "[autofocus], .ov-body input:not([type=hidden]), .ov-body select, .ov-body textarea";

export function Dialog({ kind, open, onOpenChange, title, footer, children, closeLabel = "Close", preview, previewLabel }: DialogProps) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  // `opened` is the frame after opening, so the CSS transition has a start state; `leaving` keeps the content
  // mounted during the exit transition. Both follow `open` (derived during render, not set from an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  const [opened, setOpened] = useState(false);
  const [leaving, setLeaving] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setOpened(false);
    setLeaving(!open && !isStill());
  }
  const isOpen = open && (opened || isStill()); // the `is-open` class
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (preview) return;
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    if (open) {
      if (!el.open) {
        trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        try {
          el.showModal();
        } catch {
          el.setAttribute("open", "");
        }
      }
      root.classList.add("has-dialog");
      let b = 0;
      const a = requestAnimationFrame(() => {
        b = requestAnimationFrame(() => setOpened(true));
      });
      el.querySelector<HTMLElement>(FOCUS_FIRST)?.focus({ preventScroll: true });
      return () => {
        cancelAnimationFrame(a);
        cancelAnimationFrame(b);
      };
    }
    if (el.open) {
      const finish = () => {
        try {
          el.close();
        } catch {
          el.removeAttribute("open");
        }
        if (!document.querySelector("dialog[open]:not(.is-static)")) root.classList.remove("has-dialog");
        trigger.current?.focus({ preventScroll: true });
        trigger.current = null;
      };
      if (isStill()) {
        finish();
        return;
      }
      const t = setTimeout(() => {
        finish();
        setLeaving(false);
      }, prefersReducedMotion() ? 200 : 180);
      return () => clearTimeout(t);
    }
  }, [open, preview]);

  // Never leave the page scroll-locked if the dialog unmounts while open.
  useEffect(
    () => () => {
      if (!document.querySelector("dialog[open]:not(.is-static)")) document.documentElement.classList.remove("has-dialog");
    },
    [],
  );

  const head = (
    <div className="ov-head">
      <h3 className="h-section" id={titleId}>
        {title}
      </h3>
      {kind === "sheet" ? <IconButton icon="x" label={closeLabel} onClick={close} /> : null}
    </div>
  );

  if (preview) {
    return (
      <dialog className={cx(kind, "is-static", "is-open")} open aria-label={previewLabel ?? (kind === "modal" ? "Modal preview" : "Sheet preview")}>
        {kind === "sheet" ? <div className="sheet-grab" /> : null}
        {head}
        <div className="ov-body">{children}</div>
        {footer ? <div className="ov-foot">{footer}</div> : null}
      </dialog>
    );
  }

  return (
    <dialog
      ref={ref}
      className={cx(kind, isOpen && "is-open")}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e: MouseEvent<HTMLDialogElement>) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
      }}
    >
      {open || leaving ? (
        <CloseContext.Provider value={close}>
          <div className="sheet-grab" />
          {head}
          <div className="ov-body">{children}</div>
          {footer ? <div className="ov-foot">{footer}</div> : null}
        </CloseContext.Provider>
      ) : null}
    </dialog>
  );
}
