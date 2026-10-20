import type { ReactNode } from "react";
import type { Bounds, PolygonGeometry } from "@/lib/map/geometry";

/** How a parcel is drawn: `insured` leaf green, `risk` in a forecast or flood area (orange), `off` not covered (grey). */
export type ParcelStatus = "insured" | "risk" | "off";

export interface MapParcel {
  id: string;
  /** Parcel boundary as GeoJSON, [longitude, latitude]. */
  geometry: PolygonGeometry;
  status: ParcelStatus;
  /** The parcel in focus: ink outline. */
  selected?: boolean;
  /** Accessible name when parcels are selectable, for example "DMK-01 · Karanganyar Utara". */
  label?: string;
}

/** A place name drawn on the map (white pill / outlined text). */
export interface MapPlace {
  text: string;
  lng: number;
  lat: number;
}

/** What the renderers expose so the shared zoom buttons can drive them. */
export interface MapApi {
  zoomIn: () => void;
  zoomOut: () => void;
}

/** Terra Draw polygon drawing (maplibre renderer only). */
export interface MapDrawing {
  /** Start drawing a boundary. Click to add corners, double-click or Enter to finish, Esc to cancel. */
  enabled: boolean;
  /** Called with the boundary when the person finishes it. The backend measures the area (PostGIS); the UI does not. */
  onPolygon: (polygon: PolygonGeometry) => void;
  /** Change this value to clear the drawn boundary and start again. */
  resetKey?: string | number;
}

export interface MapRendererProps {
  parcels: MapParcel[];
  places: MapPlace[];
  /** [minLng, minLat, maxLng, maxLat]. Schematic: stretched onto the frame. Maplibre: initial view. */
  bounds?: Bounds;
  ariaLabel: string;
  onSelectParcel?: (id: string) => void;
  onApi: (api: MapApi) => void;
}

export interface MapProps {
  parcels?: MapParcel[];
  places?: MapPlace[];
  bounds?: Bounds;
  /** Describes the map for assistive tech, for example "Schematic map of Demak with six parcels". */
  ariaLabel: string;
  /** Frame height in px. Default 360. */
  height?: number;
  /** `schematic` or `maplibre`. Default from NEXT_PUBLIC_MAP_RENDERER (schematic). */
  renderer?: "schematic" | "maplibre";
  /** MapLibre style URL. Default from NEXT_PUBLIC_MAP_STYLE_URL. Required for `maplibre`; no provider is built in. */
  styleUrl?: string;
  /** Schematic only: SVG drawn under the parcels in the 800 x 520 frame (water, roads). */
  backdrop?: ReactNode;
  /** Zoom buttons. Default true. */
  controls?: boolean;
  /** Adds the layers button; called when pressed. */
  onLayers?: () => void;
  onSelectParcel?: (id: string) => void;
  drawing?: MapDrawing;
  className?: string;
}
