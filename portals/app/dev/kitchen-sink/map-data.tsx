import type { Bounds, PolygonGeometry } from "@/lib/map/geometry";
import type { ParcelStatus } from "@/components/Map";

// Illustrative map data for the kitchen sink. The prototype draws its map directly in an 800 x 520 frame; here the
// same shapes are expressed as GeoJSON positions (a made-up box near Demak, not real parcels) and the schematic
// renderer projects them back onto the frame, so the page exercises the real geometry path.

/** [minLng, minLat, maxLng, maxLat] of the made-up box that the 800 x 520 frame stands for. */
export const MAP_BOUNDS: Bounds = [110.66, -6.88, 110.75, -6.81];

/** Frame coordinates (800 x 520) to longitude and latitude inside MAP_BOUNDS. */
export function fromFrame(x: number, y: number): { lng: number; lat: number } {
  const [minLng, minLat, maxLng, maxLat] = MAP_BOUNDS;
  return { lng: minLng + (x / 800) * (maxLng - minLng), lat: maxLat - (y / 520) * (maxLat - minLat) };
}

export interface KitParcel {
  id: string;
  title: string;
  status: ParcelStatus;
  selected: boolean;
  hectares: number;
  planted: string;
  pill: { tone: "pending" | "alert"; text: string };
  geometry: PolygonGeometry;
}

function polygon(pts: ReadonlyArray<readonly [number, number]>): PolygonGeometry {
  const ring = pts.map(([x, y]) => {
    const { lng, lat } = fromFrame(x, y);
    return [lng, lat] as [number, number];
  });
  ring.push(ring[0] as [number, number]);
  return { type: "Polygon", coordinates: [ring] };
}

export const KIT_PARCELS: KitParcel[] = [
  {
    id: "DMK-01",
    title: "DMK-01 · Karanganyar Utara",
    status: "insured",
    selected: true,
    hectares: 9.6,
    planted: "2025-12-02",
    pill: { tone: "pending", text: "Not insured yet" },
    geometry: polygon([[520, 140], [590, 128], [612, 180], [560, 206], [516, 180]]),
  },
  {
    id: "DMK-03",
    title: "DMK-03",
    status: "insured",
    selected: false,
    hectares: 0,
    planted: "2025-12-04",
    pill: { tone: "pending", text: "" },
    geometry: polygon([[530, 214], [596, 212], [606, 268], [548, 290], [520, 252]]),
  },
  {
    id: "DMK-02",
    title: "DMK-02 · Karanganyar Selatan",
    status: "risk",
    selected: false,
    hectares: 8.4,
    planted: "2025-12-04",
    pill: { tone: "alert", text: "In forecast area" },
    geometry: polygon([[610, 290], [670, 282], [690, 336], [640, 362], [604, 330]]),
  },
  {
    id: "DMK-04",
    title: "DMK-04",
    status: "insured",
    selected: false,
    hectares: 0,
    planted: "2025-12-04",
    pill: { tone: "pending", text: "" },
    geometry: polygon([[570, 400], [640, 396], [650, 452], [590, 470], [560, 440]]),
  },
  {
    id: "DMK-06",
    title: "DMK-06",
    status: "off",
    selected: false,
    hectares: 0,
    planted: "2025-12-04",
    pill: { tone: "pending", text: "" },
    geometry: polygon([[190, 380], [250, 372], [266, 420], [214, 444], [180, 418]]),
  },
];

/** Water and roads under the parcels (the schematic renderer's `backdrop`), in frame coordinates. */
export const MAP_BACKDROP = (
  <>
    <path d="M0 0H800V60C700 90 600 50 500 76S250 90 0 60Z" fill="var(--map-water)" />
    <path d="M640 520C650 440 600 400 560 340S470 200 470 76" fill="none" stroke="var(--map-water)" strokeWidth="22" strokeLinecap="round" />
    <path d="M300 520C300 440 330 340 380 280S420 200 420 140" fill="none" stroke="var(--map-water)" strokeWidth="14" strokeLinecap="round" />
    <path d="M0 330H800M330 90V520" stroke="var(--white)" strokeWidth="4" fill="none" />
  </>
);
