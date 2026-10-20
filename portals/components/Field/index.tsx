"use client";

import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Icon } from "@/components/icons/sprite";
import { cx } from "@/lib/cx";

// Field, Input, Affix, Select, Textarea (FR-03.2). `Field` gives its control an id, links the hint and the
// error with aria-describedby and marks the control invalid, so a form is accessible by default.

interface FieldCtx {
  id: string;
  describedBy?: string;
  invalid: boolean;
}
const FieldContext = createContext<FieldCtx | null>(null);

function useControlProps(own: { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling" }) {
  const ctx = useContext(FieldContext);
  return {
    id: own.id ?? ctx?.id,
    "aria-describedby": [own["aria-describedby"], ctx?.describedBy].filter(Boolean).join(" ") || undefined,
    "aria-invalid": own["aria-invalid"] ?? (ctx?.invalid ? true : undefined),
  };
}

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** Error text. Shown with an alert icon, never colour alone. */
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cx("field", className)}>
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        {children}
        {hint ? (
          <span className="field-hint" id={hintId}>
            {hint}
          </span>
        ) : null}
        {error ? (
          <span className="field-error" id={errorId}>
            <Icon name="alert" />
            {error}
          </span>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: InputProps) {
  const a11y = useControlProps(rest);
  return <input {...rest} {...a11y} className={cx("input", className)} />;
}

export interface AffixProps {
  /** Text before the input. Take it from the pack (currency symbol), never type it. */
  prefix?: ReactNode;
  /** Text after the input, for example the area unit from the pack. */
  suffix?: ReactNode;
  children: ReactNode;
}

/** `.affix`: an input with a fixed prefix or suffix. Put an `<Input>` inside. */
export function Affix({ prefix, suffix, children }: AffixProps) {
  return (
    <div className="affix">
      {prefix ? <span className="affix-pre">{prefix}</span> : null}
      {children}
      {suffix ? <span className="affix-suf">{suffix}</span> : null}
    </div>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...rest }: SelectProps) {
  const a11y = useControlProps(rest);
  return (
    <div className="select-wrap">
      <select {...rest} {...a11y} className={cx("select", className)}>
        {children}
      </select>
    </div>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...rest }: TextareaProps) {
  const a11y = useControlProps(rest);
  return <textarea {...rest} {...a11y} className={cx("textarea", className)} />;
}
