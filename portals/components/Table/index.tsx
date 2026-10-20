"use client";

import { useRouter } from "next/navigation";
import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

// Table (FR-03.2): `.table` inside `.table-wrap`, with the mobile stack mode (each row becomes a card with its
// column names from `data-l`), flagged and selected rows, and clickable rows.

export interface TableProps {
  /** Below 601px the rows stack as cards (`table-stack`). Default true; turn it off for tables that must scroll. */
  stack?: boolean;
  /** Accessible name for the table. */
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
}

export function Table({ stack = true, className, children, ...rest }: TableProps) {
  return (
    <div className="table-wrap">
      <table className={cx("table", stack && "table-stack", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

/** `.table-tools`: filter chips, search and the row count above a table. Put `<span className="count">` last. */
export function TableTools({ children }: { children: ReactNode }) {
  return <div className="table-tools">{children}</div>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Right-align (numbers). */
  right?: boolean;
}

export function Th({ right, className, scope = "col", ...rest }: ThProps) {
  return <th scope={scope} className={cx(right && "r", className)} {...rest} />;
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Column name shown in front of the value in stack mode (`data-l`). */
  label?: string;
  /** First-column identifier: bold. */
  ident?: boolean;
  /** Right-aligned tabular figures. */
  num?: boolean;
}

export function Td({ label, ident, num, className, ...rest }: TdProps) {
  return <td className={cx(ident && "id", num && "num", className)} data-l={label} {...rest} />;
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Highlight as the current row (green). */
  selected?: boolean;
  /** Highlight as needing attention (amber). Pair with a pill so status is never colour alone. */
  flagged?: boolean;
  /** Makes the whole row a link: click or Enter goes there. Clicks on links, buttons and inputs inside keep their own action. */
  href?: string;
}

export function Tr({ selected, flagged, href, className, onClick, onKeyDown, ...rest }: TrProps) {
  const router = useRouter();
  const interactive = "a,button,input,select,textarea,summary";
  return (
    <tr
      className={cx(selected && "is-sel", flagged && "is-flag", className)}
      data-href={href}
      tabIndex={href ? 0 : undefined}
      aria-current={selected ? "true" : undefined}
      onClick={(e: MouseEvent<HTMLTableRowElement>) => {
        onClick?.(e);
        if (href && !e.defaultPrevented && !(e.target as HTMLElement).closest(interactive)) router.push(href);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
        onKeyDown?.(e);
        if (href && e.key === "Enter" && e.target === e.currentTarget) router.push(href);
      }}
      {...rest}
    />
  );
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell content. Default: `String(row[key])`. */
  render?: (row: T) => ReactNode;
  align?: "right";
  /** Bold identifier column. */
  ident?: boolean;
  /** Name shown in stack mode. Default: `header` when it is a string. */
  label?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  isSelected?: (row: T) => boolean;
  isFlagged?: (row: T) => boolean;
  stack?: boolean;
  "aria-label"?: string;
}

/** A table from column definitions, for the common case. Use the primitives above when a row needs custom markup. */
export function DataTable<T>({ columns, rows, rowKey, rowHref, isSelected, isFlagged, stack, "aria-label": ariaLabel }: DataTableProps<T>) {
  return (
    <Table stack={stack} aria-label={ariaLabel}>
      <THead>
        <tr>
          {columns.map((c) => (
            <Th key={c.key} right={c.align === "right"}>
              {c.header}
            </Th>
          ))}
        </tr>
      </THead>
      <TBody>
        {rows.map((row) => (
          <Tr key={rowKey(row)} href={rowHref?.(row)} selected={isSelected?.(row)} flagged={isFlagged?.(row)}>
            {columns.map((c) => (
              <Td
                key={c.key}
                ident={c.ident}
                num={c.align === "right"}
                label={c.label ?? (typeof c.header === "string" ? c.header : undefined)}
              >
                {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
              </Td>
            ))}
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
