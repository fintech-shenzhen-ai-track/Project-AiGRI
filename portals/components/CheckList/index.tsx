import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";

export type CheckTone = "ok" | "need" | "denied";

const ICON: Record<CheckTone, IconName> = { ok: "check", need: "alert", denied: "x" };

export interface CheckListItem {
  tone: CheckTone;
  text: ReactNode;
}

/** `.check-list`: results of checks. Icon and wording both carry the status, never colour alone. */
export function CheckList({ items }: { items: CheckListItem[] }) {
  return (
    <ul className="check-list">
      {items.map((it, i) => (
        <li key={i} className={`is-${it.tone}`}>
          <Icon name={ICON[it.tone]} />
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}
