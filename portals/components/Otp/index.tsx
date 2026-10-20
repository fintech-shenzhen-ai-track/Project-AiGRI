"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

export interface OtpProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once when every digit is filled. */
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
}

/** `.otp`: one-time code entry, one digit per box. Moves on as you type, backs up on delete, accepts a pasted code. */
export function Otp({ length = 6, value, defaultValue = "", onChange, onComplete, autoFocus, invalid, "aria-label": label = "One-time code" }: OtpProps) {
  const [inner, setInner] = useState(defaultValue.replace(/\D/g, "").slice(0, length));
  const code = (value ?? inner).padEnd(length, " ").slice(0, length);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const commit = (digits: string) => {
    const clean = digits.replace(/\D/g, "").slice(0, length);
    if (value === undefined) setInner(clean);
    onChange?.(clean);
    if (clean.length === length) onComplete?.(clean);
  };
  const focus = (i: number) => boxes.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i: number, ch: string) => {
    const chars = code.split("");
    chars[i] = ch || " ";
    commit(chars.join("").replace(/ +$/, "").replace(/ /g, ""));
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i]?.trim()) {
      e.preventDefault();
      focus(i - 1);
      if (i > 0) setAt(i - 1, "");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    e.preventDefault();
    commit(digits);
    focus(digits.length >= length ? length - 1 : digits.length);
  };

  return (
    <div className="otp" role="group" aria-label={label}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          className="input"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          autoFocus={autoFocus && i === 0}
          value={code[i]?.trim() ?? ""}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, d);
            if (d) focus(i + 1);
          }}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
