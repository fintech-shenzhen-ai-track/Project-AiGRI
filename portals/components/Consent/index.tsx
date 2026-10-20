"use client";

import type { ReactNode } from "react";
import { Check } from "@/components/Check";
import { Hash } from "@/components/Hash";
import { cx } from "@/lib/cx";

export interface ConsentProps {
  /** "What you share with Asuransi Jasindo" */
  title: ReactNode;
  /** Exactly what is shared, and nothing else. */
  children: ReactNode;
  /** Hash of the exact payload the Client is confirming (Tier 2). Shown so it can be compared; the server checks it. */
  hash: string;
  /** "I agree to share this data with Asuransi Jasindo for this policy." */
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

/**
 * `.consent`: a cream block that states what is shared, shows the payload hash, and asks for a checkbox.
 * Consent is per insurer, minimal, and bound to the exact payload (Constitution IV.3).
 */
export function Consent({ title, children, hash, label, checked, defaultChecked, onCheckedChange, className }: ConsentProps) {
  return (
    <div className={cx("consent", className)}>
      <p className="h-card">{title}</p>
      <p className="small">{children}</p>
      <Hash value={hash} display={hash} copy={false} />
      <Check checked={checked} defaultChecked={defaultChecked} onChange={(e) => onCheckedChange?.(e.target.checked)}>
        {label}
      </Check>
    </div>
  );
}
