"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";
import { cx } from "@/lib/cx";
import { useSelectGroup } from "./group";

export { SelectGroup, type SelectGroupProps } from "./group";

export interface ChoiceProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "value"> {
  /** Identifies the choice inside a `<SelectGroup>`. */
  value?: string;
  /** Selected state when used on its own (inside a group the group decides). */
  selected?: boolean;
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
}

/** `.choice`: a large selectable card with a check badge. Use inside a `<SelectGroup>`. */
export function Choice({ value, selected, icon, title, description, className, onClick, ...rest }: ChoiceProps) {
  const group = useSelectGroup();
  const on = group && value !== undefined ? group.isSelected(value) : Boolean(selected);
  return (
    <button
      type="button"
      className={cx("choice", on && "is-sel", className)}
      aria-pressed={on}
      onClick={(e) => {
        onClick?.(e);
        if (group && value !== undefined) group.toggle(value);
      }}
      {...rest}
    >
      {icon ? (
        <span className="ico-dot" style={{ background: "var(--white)" }}>
          <Icon name={icon} />
        </span>
      ) : null}
      <span className="h-card">{title}</span>
      {description ? <span className="small muted">{description}</span> : null}
      <span className="choice-badge">
        <Icon name="check" />
      </span>
    </button>
  );
}
