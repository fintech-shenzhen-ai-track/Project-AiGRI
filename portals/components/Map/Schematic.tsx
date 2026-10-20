"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { boundsOf, fitProjection, ringPoints, stretchProjection } from "@/lib/map/geometry";
import type { MapParcel, MapRendererProps, ParcelStatus } from "./types";

// The `schematic` renderer: the prototype's SVG map look, drawn from the same parcel geometries the maplibre
// renderer shows. Not to scale (Constitution X: honest data; the map says so). The frame is 800 x 520 and
// scales to its container ("slice"), exactly as in the prototype.

export const FRAME_W = 800;
export const FRAME_H = 520;

const FILL: Record<ParcelStatus, string> = { insured: "var(--parcel)", risk: "var(--parcel-risk)", off: "var(--parcel-off)" };
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function SchematicMap({
  parcels,
  places,
  bounds,
  ariaLabel,
  onSelectParcel,
  onApi,
  backdrop,
}: MapRendererProps & { backdrop?: ReactNode }) {
  const [zoom, setZoom] = useState(1);

  const project = useMemo(() => {
    if (bounds) return stretchProjection(bounds, FRAME_W, FRAME_H);
    const rings = parcels.map((p) => p.geometry.coordinates[0] ?? []);
    return fitProjection(rings.length ? boundsOf(rings) : [0, 0, 1, 1], FRAME_W, FRAME_H);
  }, [bounds, parcels]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5)), []);
  useEffect(() => onApi({ zoomIn, zoomOut }), [onApi, zoomIn, zoomOut]);

  const w = FRAME_W / zoom;
  const h = FRAME_H / zoom;
  const viewBox = `${(FRAME_W - w) / 2} ${(FRAME_H - h) / 2} ${w} ${h}`;
  const interactive = Boolean(onSelectParcel);

  const onKey = (e: KeyboardEvent<SVGPolygonElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectParcel?.(id);
    }
  };

  // Painted so that selected parcels sit on top.
  const ordered = [...parcels].sort((a, b) => Number(Boolean(a.selected)) - Number(Boolean(b.selected)));

  return (
    <svg
      className="map-svg"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      role={interactive ? "group" : "img"}
      aria-label={ariaLabel}
    >
      <rect x="0" y="0" width={FRAME_W} height={FRAME_H} fill="var(--map-land)" />
      {backdrop}
      {ordered.map((p: MapParcel) => (
        <polygon
          key={p.id}
          points={ringPoints(p.geometry.coordinates[0] ?? [], project)}
          fill={FILL[p.status]}
          stroke={p.selected ? "var(--ink)" : "var(--white)"}
          strokeWidth={p.selected ? 3 : 2}
          {...(interactive
            ? {
                role: "button",
                tabIndex: 0,
                "aria-label": p.label ?? p.id,
                "aria-pressed": Boolean(p.selected),
                style: { cursor: "pointer" },
                onClick: () => onSelectParcel?.(p.id),
                onKeyDown: (e: KeyboardEvent<SVGPolygonElement>) => onKey(e, p.id),
              }
            : {})}
        />
      ))}
      {places.map((pl) => {
        const [x, y] = project(pl.lng, pl.lat);
        return (
          <text key={`${pl.text}-${pl.lng}-${pl.lat}`} className="map-label" x={Math.round(x)} y={Math.round(y)}>
            {pl.text}
          </text>
        );
      })}
    </svg>
  );
}
