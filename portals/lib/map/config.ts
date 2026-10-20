// Map configuration (D-13). Two renderers sit behind one <Map>: `schematic` (the prototype's SVG look, drawn from
// the same parcel geometries; the default, the offline fallback and what demo recordings use) and `maplibre`
// (MapLibre GL JS with a vector style; real geography and parcel drawing with Terra Draw).
//
// Both values are NEXT_PUBLIC_* so they are inlined at build time:
//   NEXT_PUBLIC_MAP_RENDERER   "schematic" (default) | "maplibre"
//   NEXT_PUBLIC_MAP_STYLE_URL  URL of the MapLibre vector style JSON. REQUIRED for the maplibre renderer.
// No tile provider or style URL is built in: the project has not chosen one (raised as a decision). Without a
// style URL the renderer falls back to `schematic`.

export type MapRenderer = "schematic" | "maplibre";

export interface MapConfig {
  renderer: MapRenderer;
  styleUrl: string | undefined;
}

export function mapConfig(env: Record<string, string | undefined> = { NEXT_PUBLIC_MAP_RENDERER: process.env.NEXT_PUBLIC_MAP_RENDERER, NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL }): MapConfig {
  const requested = env.NEXT_PUBLIC_MAP_RENDERER === "maplibre" ? "maplibre" : "schematic";
  const styleUrl = env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || undefined;
  return { renderer: requested, styleUrl };
}

/**
 * The renderer that can actually run: `maplibre` needs a style URL. Without one, `schematic` is used and the
 * second value says why, so the caller can warn once in development.
 */
export function resolveRenderer(requested: MapRenderer, styleUrl: string | undefined): { renderer: MapRenderer; reason?: string } {
  if (requested === "maplibre" && !styleUrl) {
    return { renderer: "schematic", reason: "NEXT_PUBLIC_MAP_STYLE_URL is not set, so the maplibre renderer cannot start; using the schematic renderer." };
  }
  return { renderer: requested };
}
