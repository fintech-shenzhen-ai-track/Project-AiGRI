"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface TabItem {
  id: string;
  label: ReactNode;
  /** Count shown in a badge, for example the number of open claims. */
  badge?: ReactNode;
  /** `need` gives the amber badge for items that wait for someone. */
  badgeTone?: "need";
  /** Panel content. Leave out when the tabs only change the URL or a filter and the content lives elsewhere. */
  panel?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  "aria-label": string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Class for each panel. Panels sit 16px below the tab bar by default. */
  panelClassName?: string;
}

/** `.tabs`: tab list with an ink bar that slides under the selected tab, arrow-key navigation, and panels. */
export function Tabs({ tabs, "aria-label": ariaLabel, value, defaultValue, onValueChange, panelClassName }: TabsProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.id ?? "");
  const current = value ?? inner;
  const root = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState<{ x: number; w: number } | null>(null);
  const [animated, setAnimated] = useState(false);

  const place = useCallback(() => {
    const sel = root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!sel) return;
    const pl = parseFloat(getComputedStyle(sel).paddingLeft) || 0;
    setInk({ x: sel.offsetLeft + pl, w: Math.max(1, sel.offsetWidth - pl * 2) });
  }, []);

  useLayoutEffect(place, [place, current, tabs]);

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

  const select = (id: string, focus: boolean) => {
    if (value === undefined) setInner(id);
    onValueChange?.(id);
    if (focus) root.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`)?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let n = -1;
    if (e.key === "ArrowRight") n = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    const next = tabs[n];
    if (next) {
      e.preventDefault();
      select(next.id, true);
    }
  };

  return (
    <>
      <div ref={root} className="tabs" role="tablist" aria-label={ariaLabel}>
        {tabs.map((t, i) => {
          const on = t.id === current;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="tab-btn"
              id={`${uid}-tab-${t.id}`}
              data-tab-id={t.id}
              aria-selected={on}
              aria-controls={t.panel !== undefined ? `${uid}-panel-${t.id}` : undefined}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.id, false)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {t.label}
              {t.badge !== undefined ? <span className={cx("nav-badge", t.badgeTone === "need" && "is-need")}>{t.badge}</span> : null}
            </button>
          );
        })}
        <span
          className="tabs-ink"
          aria-hidden="true"
          style={ink ? { transform: `translateX(${ink.x}px) scaleX(${ink.w})`, transition: animated ? undefined : "none" } : { opacity: 0 }}
        />
      </div>
      {tabs.map((t) =>
        t.panel !== undefined ? (
          <div
            key={t.id}
            className={cx("tab-panel", panelClassName)}
            id={`${uid}-panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${t.id}`}
            hidden={t.id !== current}
            style={panelClassName ? undefined : { marginTop: 16 }}
          >
            {t.panel}
          </div>
        ) : null,
      )}
    </>
  );
}
