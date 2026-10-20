import type { ReactNode } from "react";

export interface ErrorStateProps {
  title: ReactNode;
  /** What failed, what is not affected, and what to do. User-safe wording only (see lib/api/errors). */
  children?: ReactNode;
  /** Usually a "Try again" `<Button variant="danger" size="sm">`. */
  action?: ReactNode;
}

/** `.error-state`: a part of the page failed to load. The rest of the page stays usable. */
export function ErrorState({ title, children, action }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <h3 className="h-card">{title}</h3>
      {children ? <p className="small">{children}</p> : null}
      {action}
    </div>
  );
}
