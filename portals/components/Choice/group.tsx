"use client";

import { createContext, useCallback, useContext, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";

// `[data-select-group]` of the prototype: a set of Choices or Chips where one (single) or several (multiple) are
// selected. Controlled with `value` + `onValueChange`, or uncontrolled with `defaultValue`.

interface GroupCtx {
  isSelected: (value: string) => boolean;
  toggle: (value: string) => void;
}
const GroupContext = createContext<GroupCtx | null>(null);

/** The group a Choice or Chip sits in, or null when it is used on its own. */
export function useSelectGroup(): GroupCtx | null {
  return useContext(GroupContext);
}

export interface SelectGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Several can be selected. Value is then a list. */
  multiple?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: ReactNode;
}

const asList = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function SelectGroup({ multiple, value, defaultValue, onValueChange, children, role = "group", ...rest }: SelectGroupProps) {
  const [inner, setInner] = useState<string[]>(asList(defaultValue));
  const selected = value !== undefined ? asList(value) : inner;

  const toggle = useCallback(
    (v: string) => {
      const next = multiple ? (selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]) : [v];
      if (value === undefined) setInner(next);
      onValueChange?.(multiple ? next : (next[0] as string));
    },
    [multiple, selected, value, onValueChange],
  );

  const ctx = useMemo<GroupCtx>(() => ({ isSelected: (v) => selected.includes(v), toggle }), [selected, toggle]);
  return (
    <GroupContext.Provider value={ctx}>
      <div role={role} {...rest}>
        {children}
      </div>
    </GroupContext.Provider>
  );
}
