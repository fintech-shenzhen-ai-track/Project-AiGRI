// Geometry helpers for the schematic map renderer and parcel thumbnails. Pure functions on GeoJSON-style
// [longitude, latitude] positions. No areas are computed here: areas come from the backend (PostGIS).

export type Position = [number, number];
export type Ring = Position[];
/** [minLng, minLat, maxLng, maxLat] */
export type Bounds = [number, number, number, number];

export interface PolygonGeometry {
  type: "Polygon";
  /** First ring is the outer boundary. */
  coordinates: Ring[];
}

export function boundsOf(rings: Ring[]): Bounds {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
  if (!Number.isFinite(minLng)) return [0, 0, 1, 1];
  return [minLng, minLat, maxLng, maxLat];
}

export type Project = (lng: number, lat: number) => [number, number];

/** Map `bounds` linearly onto a `width` x `height` box (schematic: not to scale). */
export function stretchProjection(bounds: Bounds, width: number, height: number): Project {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const sx = maxLng > minLng ? width / (maxLng - minLng) : 1;
  const sy = maxLat > minLat ? height / (maxLat - minLat) : 1;
  return (lng, lat) => [(lng - minLng) * sx, (maxLat - lat) * sy];
}

/**
 * Fit `bounds` into the box keeping the shape (longitude scaled by cos(latitude)), centred, with `pad` as a
 * fraction of the box kept free around it.
 */
export function fitProjection(bounds: Bounds, width: number, height: number, pad = 0.12): Project {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180) || 1;
  const spanX = Math.max((maxLng - minLng) * k, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);
  const s = Math.min((width * (1 - 2 * pad)) / spanX, (height * (1 - 2 * pad)) / spanY);
  const offX = (width - spanX * s) / 2;
  const offY = (height - spanY * s) / 2;
  return (lng, lat) => [offX + (lng - minLng) * k * s, offY + (maxLat - lat) * s];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** SVG `points` attribute for a ring. */
export function ringPoints(ring: Ring, project: Project): string {
  return ring.map(([lng, lat]) => project(lng, lat).map(r1).join(",")).join(" ");
}

/** A closed ring without the repeated last position (GeoJSON repeats the first). */
export function openRing(ring: Ring): Ring {
  const a = ring[0];
  const b = ring[ring.length - 1];
  return ring.length > 1 && a && b && a[0] === b[0] && a[1] === b[1] ? ring.slice(0, -1) : ring;
}

/** Points for a 44 x 44 thumbnail of one parcel (`.parcel-thumb svg`): the shape fitted with a 5px margin. */
export function thumbPoints(ring: Ring, size = 44, margin = 5): string {
  const open = openRing(ring);
  const project = fitProjection(boundsOf([open]), size, size, margin / size);
  return ringPoints(open, project);
}
