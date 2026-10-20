"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSelectGroup } from "@/components/Choice/group";
import { cx } from "@/lib/cx";
import type { Ring } from "@/lib/map/geometry";
import { thumbPoints } from "@/lib/map/geometry";

const FILL = { insured: "var(--parcel)", risk: "var(--parcel-risk)", off: "var(--parcel-off)" } as const;

export interface ParcelTileProps {
  /** Identifies the tile inside a `<SelectGroup>`. */
  value?: string;
  /** Where the tile goes. */
  href: string;
  selected?: boolean;
  /** Parcel boundary ring for the thumbnail, [longitude, latitude]. */
  ring: Ring;
  tone?: keyof typeof FILL;
  /** "DMK-01 · Karanganyar Utara" */
  title: ReactNode;
  /** "9,6 ha · Inpari 32 · planted 2 Dec 2025", formatted through the pack. */
  meta?: ReactNode;
  /** A `<StatusPill>`. */
  status?: ReactNode;
  onSelect?: () => void;
}

/** `.parcel-tile`: a parcel in a list, with a thumbnail of its shape, name, details and status. */
export function ParcelTile({ value, href, selected, ring, tone = "insured", title, meta, status, onSelect }: ParcelTileProps) {
  const group = useSelectGroup();
  const on = group && value !== undefined ? group.isSelected(value) : Boolean(selected);
  const content = (
    <>
      <span className="parcel-thumb">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <polygon points={thumbPoints(ring)} fill={FILL[tone]} />
        </svg>
      </span>
      <span className="grow">
        <span className="h-card" style={{ display: "block" }}>
          {title}
        </span>
        {meta ? (
          <span className="meta" style={{ display: "block" }}>
            {meta}
          </span>
        ) : null}
      </span>
      {status}
    </>
  );
  const props = {
    className: cx("parcel-tile", on && "is-sel"),
    "aria-current": on ? ("true" as const) : undefined,
    onClick: () => {
      onSelect?.();
      if (group && value !== undefined) group.toggle(value);
    },
  };
  return href.startsWith("#") ? (
    <a href={href} {...props}>
      {content}
    </a>
  ) : (
    <Link href={href} {...props}>
      {content}
    </Link>
  );
}
