import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface KvItem {
  label: ReactNode;
  value: ReactNode;
  /** Secondary line under the value (a `.meta`), for example a rate. */
  meta?: ReactNode;
}

/** `.kv`: label and value pairs as a description list. */
export function Kv({ items, className }: { items: KvItem[]; className?: string }) {
  return (
    <dl className={cx("kv", className)}>
      {items.map((it, i) => (
        <div key={i}>
          <dt>{it.label}</dt>
          <dd>
            {it.value}
            {it.meta ? <span className="meta">{it.meta}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
