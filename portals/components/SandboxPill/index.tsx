import { cx } from "@/lib/cx";

/** `.sandbox`: marks money, messages and data that are not real. Shown wherever the mock wallet or inbox appears. */
export function SandboxPill({ className }: { className?: string }) {
  return <span className={cx("sandbox", className)}>Sandbox</span>;
}
