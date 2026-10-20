import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";
import { Reveal } from "@/components/Reveal";
import { cx } from "@/lib/cx";

export type PillTone = "ok" | "pending" | "info" | "need" | "denied" | "alert";

export interface StatusPillProps {
  tone?: PillTone;
  /** Optional icon, for example `file-pen` on "Drafted by AiGRI". The dot already marks the status; text always names it. */
  icon?: IconName;
  /** Scale in when it first appears (a status that has just changed). */
  pop?: boolean;
  /** Pop delay in ms. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

/** `.pill`: a status. The label is always text, never colour alone. */
export function StatusPill({ tone = "pending", icon, pop, delay, className, children }: StatusPillProps) {
  const cls = cx("pill", `pill-${tone}`, className);
  const body = (
    <>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </>
  );
  return pop ? (
    <Reveal as="span" kind="pop" delay={delay} className={cls}>
      {body}
    </Reveal>
  ) : (
    <span className={cls}>{body}</span>
  );
}
