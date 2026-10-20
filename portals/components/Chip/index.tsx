"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { useSelectGroup } from "@/components/Choice/group";

export { SelectGroup as ChipGroup } from "@/components/Choice/group";

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /** Identifies the chip inside a `<ChipGroup>`. */
  value?: string;
  selected?: boolean;
  /** Render a plain `<span>` (a label that looks like a chip, for example a filter summary). */
  inert?: boolean;
  children: ReactNode;
}

/** `.chip`: a filter or option pill. Toggles inside a `<ChipGroup multiple>`. */
export function Chip({ value, selected, inert, className, children, onClick, ...rest }: ChipProps) {
  const group = useSelectGroup();
  const on = group && value !== undefined ? group.isSelected(value) : Boolean(selected);
  if (inert) return <span className={cx("chip", on && "is-sel", className)}>{children}</span>;
  return (
    <button
      type="button"
      className={cx("chip", on && "is-sel", className)}
      aria-pressed={on}
      onClick={(e) => {
        onClick?.(e);
        if (group && value !== undefined) group.toggle(value);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
