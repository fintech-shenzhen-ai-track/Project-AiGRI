"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "@/components/Button";
import { mapConfig, resolveRenderer } from "@/lib/map/config";
import { cx } from "@/lib/cx";
import { SchematicMap } from "./Schematic";
import type { MapApi, MapProps } from "./types";

export type { MapApi, MapDrawing, MapParcel, MapPlace, MapProps, ParcelStatus } from "./types";
export { Legend, MapLabel, type LegendItem } from "./Legend";

// The maplibre renderer (MapLibre GL JS + Terra Draw) is a separate chunk, fetched only when it is used.
// While it loads the frame shows the plain map-land colour of `.map`.
const MapLibreRenderer = dynamic(() => import("./MapLibre"), { ssr: false });

const NO_PARCELS: never[] = [];

/**
 * `.map` frame, the renderer inside it, and the zoom buttons. D-13: `schematic` or `maplibre`, one component.
 * Exported as `Map` and `MapView`; import it as `MapView` where the global `Map` is also needed.
 */
function MapView({
  parcels = NO_PARCELS,
  places = NO_PARCELS,
  bounds,
  ariaLabel,
  height = 360,
  renderer: rendererProp,
  styleUrl: styleUrlProp,
  backdrop,
  controls = true,
  onLayers,
  onSelectParcel,
  drawing,
  className,
}: MapProps) {
  const cfg = useMemo(() => mapConfig(), []);
  const { renderer, reason } = resolveRenderer(rendererProp ?? cfg.renderer, styleUrlProp ?? cfg.styleUrl);
  const styleUrl = styleUrlProp ?? cfg.styleUrl;
  const [api, setApi] = useState<MapApi | null>(null);

  useEffect(() => {
    if (reason && process.env.NODE_ENV !== "production") console.warn(`[Map] ${reason}`);
  }, [reason]);

  const common = { parcels, places, bounds, ariaLabel, onSelectParcel, onApi: setApi };
  return (
    <div className={cx("map", className)} style={{ height }}>
      {renderer === "maplibre" && styleUrl ? (
        <MapLibreRenderer {...common} styleUrl={styleUrl} drawing={drawing} />
      ) : (
        <SchematicMap {...common} backdrop={backdrop} />
      )}
      {controls ? (
        <div className="map-ctrl">
          <IconButton icon="plus" label="Zoom in" onClick={() => api?.zoomIn()} />
          <IconButton icon="minus" label="Zoom out" onClick={() => api?.zoomOut()} />
          {onLayers ? <IconButton icon="layers" label="Layers" onClick={onLayers} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export { MapView, MapView as Map };
