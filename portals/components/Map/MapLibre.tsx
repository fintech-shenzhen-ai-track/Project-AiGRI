"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { Map as GLMap, Marker, type GeoJSONSource, type MapMouseEvent } from "maplibre-gl";
import { TerraDraw, TerraDrawPolygonMode, type GeoJSONStoreFeatures } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { useEffect, useRef, useState } from "react";
import { boundsOf, type PolygonGeometry } from "@/lib/map/geometry";
import { reducedMotion } from "@/lib/motion";
import type { MapDrawing, MapRendererProps } from "./types";

// The `maplibre` renderer (D-13): MapLibre GL JS with a vector style from configuration, the parcels as a GeoJSON
// layer, place names as HTML markers, and Terra Draw for drawing a parcel boundary. Loaded on demand, so pages
// that use the schematic renderer never download MapLibre.
//
// Colours come from the design tokens (CSS custom properties), not from literals in this file.

const SOURCE = "aigri-parcels";
const FILL_LAYER = "aigri-parcels-fill";
const LINE_LAYER = "aigri-parcels-line";

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export interface MapLibreProps extends MapRendererProps {
  styleUrl: string;
  drawing?: MapDrawing;
}

export default function MapLibreRenderer({ styleUrl, parcels, places, bounds, ariaLabel, onSelectParcel, onApi, drawing }: MapLibreProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GLMap | null>(null);
  const [ready, setReady] = useState(false); // true once the style has loaded; the effects below wait for it
  const select = useRef(onSelectParcel);
  const apiCb = useRef(onApi);
  const initialBounds = useRef(bounds);
  const initialParcels = useRef(parcels);
  useEffect(() => {
    select.current = onSelectParcel;
    apiCb.current = onApi;
  });

  // The map itself.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const b = initialBounds.current ?? (initialParcels.current.length ? boundsOf(initialParcels.current.map((p) => p.geometry.coordinates[0] ?? [])) : undefined);
    const m = new GLMap({
      container: el,
      style: styleUrl,
      attributionControl: { compact: true },
      ...(b ? { bounds: [[b[0], b[1]], [b[2], b[3]]] as [[number, number], [number, number]], fitBoundsOptions: { padding: 48 } } : {}),
    });
    mapRef.current = m;
    m.on("load", () => setReady(true));
    apiCb.current({ zoomIn: () => void m.zoomIn(), zoomOut: () => void m.zoomOut() });
    return () => {
      setReady(false);
      mapRef.current = null;
      m.remove();
    };
  }, [styleUrl]);

  // Parcels as one GeoJSON source with a fill and an outline layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const data = {
      type: "FeatureCollection" as const,
      features: parcels.map((p) => ({
        type: "Feature" as const,
        id: p.id,
        properties: { id: p.id, status: p.status, selected: Boolean(p.selected) },
        geometry: p.geometry,
      })),
    };
    const existing = map.getSource(SOURCE) as GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
      return;
    }
    map.addSource(SOURCE, { type: "geojson", data });
    map.addLayer({
      id: FILL_LAYER,
      type: "fill",
      source: SOURCE,
      paint: {
        "fill-color": ["match", ["get", "status"], "risk", token("--parcel-risk"), "off", token("--parcel-off"), token("--parcel")],
        "fill-opacity": 0.8,
      },
    });
    map.addLayer({
      id: LINE_LAYER,
      type: "line",
      source: SOURCE,
      paint: {
        "line-color": ["case", ["get", "selected"], token("--ink"), token("--white")],
        "line-width": ["case", ["get", "selected"], 3, 2],
      },
    });
    const onClick = (e: MapMouseEvent) => {
      const id = map.queryRenderedFeatures(e.point, { layers: [FILL_LAYER] })[0]?.properties?.id;
      if (typeof id === "string") select.current?.(id);
    };
    map.on("click", FILL_LAYER, onClick);
    map.on("mouseenter", FILL_LAYER, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", FILL_LAYER, () => (map.getCanvas().style.cursor = ""));
  }, [ready, parcels]);

  // Place names as HTML markers (the style's own labels are the style's business).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers = places.map((pl) => {
      const el = document.createElement("span");
      el.className = "map-label";
      el.textContent = pl.text;
      return new Marker({ element: el }).setLngLat([pl.lng, pl.lat]).addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [ready, places]);

  // Keep the view on the parcels when they change (and no explicit bounds are given).
  const fitted = useRef("");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || bounds || !parcels.length) return;
    const key = parcels.map((p) => p.id).join("|");
    if (fitted.current === key) return;
    fitted.current = key;
    const b = boundsOf(parcels.map((p) => p.geometry.coordinates[0] ?? []));
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 48, duration: reducedMotion() ? 0 : 600 });
  }, [ready, bounds, parcels]);

  // Drawing a parcel boundary with Terra Draw.
  const enabled = Boolean(drawing?.enabled);
  const resetKey = drawing?.resetKey;
  const onPolygon = useRef(drawing?.onPolygon);
  useEffect(() => {
    onPolygon.current = drawing?.onPolygon;
  });
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !enabled) return;
    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawPolygonMode({
          editable: true,
          keyEvents: { cancel: "Escape", finish: "Enter" },
          // Terra Draw's own option names (quoted keys): they style a polygon on the map, not a UI focus ring.
          styles: {
            fillColor: token("--parcel") as `#${string}`,
            fillOpacity: 0.4,
            "outlineColor": token("--ink") as `#${string}`,
            "outlineWidth": 3,
            closingPointColor: token("--white") as `#${string}`,
            "closingPointOutlineColor": token("--ink") as `#${string}`,
          },
        }),
      ],
    });
    draw.start();
    draw.setMode("polygon");
    draw.on("finish", (id) => {
      const feature: GeoJSONStoreFeatures | undefined = draw.getSnapshotFeature(id);
      if (feature?.geometry.type !== "Polygon") return;
      // One boundary at a time: drop any earlier drawing, keep this one on the map.
      const earlier = draw.getSnapshot().filter((f) => f.id !== id).map((f) => f.id as string | number);
      if (earlier.length) draw.removeFeatures(earlier);
      onPolygon.current?.(feature.geometry as PolygonGeometry);
    });
    return () => {
      try {
        draw.stop();
      } catch {
        // the map may already be gone
      }
    };
  }, [ready, enabled, resetKey]);

  return <div ref={host} className="map-svg" role="region" aria-label={ariaLabel} />;
}
