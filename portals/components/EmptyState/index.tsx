import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/sprite";

export interface EmptyStateProps {
  icon?: IconName;
  title: ReactNode;
  /** Say what will appear here and what to do, in a friendly way. */
  children?: ReactNode;
  action?: ReactNode;
}

/** `.empty`: nothing here yet. */
export function EmptyState({ icon = "file-check", title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size="lg" />
      </span>
      <h3 className="h-card">{title}</h3>
      {children ? <p className="small">{children}</p> : null}
      {action}
    </div>
  );
}
