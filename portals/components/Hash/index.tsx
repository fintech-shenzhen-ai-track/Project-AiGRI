"use client";

import { IconButton } from "@/components/Button";
import { cx } from "@/lib/cx";
import { toast } from "@/lib/toast";

/** "7c41e9a2b1d3…b02d" style short form: first 6 and last 4 characters of a hex digest. */
export function shortHash(full: string): string {
  return full.length <= 12 ? full : `${full.slice(0, 6)}…${full.slice(-4)}`;
}

async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // fall through to the textarea fallback
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export interface HashProps {
  /** The full digest. Shown in the tooltip and copied. */
  value: string;
  /** What to print. Defaults to the short form of `value`. */
  display?: string;
  /** Show the copy button. Default true. */
  copy?: boolean;
  className?: string;
}

/** `.hash`: a SHA-256 or other digest in mono type, with a copy button that toasts "Copied". */
export function Hash({ value, display, copy = true, className }: HashProps) {
  const shown = display ?? shortHash(value);
  return (
    <span className={cx("hash", className)} title={value}>
      {shown}
      {copy ? (
        <IconButton
          icon="copy"
          small
          label={`Copy ${shown}`}
          data-copy={value}
          onClick={() => {
            void copyText(value).then(() => toast("Copied", { tone: "ok", duration: 2000 }));
          }}
        />
      ) : null}
    </span>
  );
}
