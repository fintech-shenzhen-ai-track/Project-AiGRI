import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { boundsOf, fitProjection, ringPoints, stretchProjection, thumbPoints, type PolygonGeometry } from "@/lib/map/geometry";
import { mapConfig, resolveRenderer } from "@/lib/map/config";

// --- mocks for the maplibre renderer: no WebGL in jsdom -------------------------------------------------------
const gl = vi.hoisted(() => {
  const state = {
    maps: [] as Array<Record<string, unknown>>,
    draws: [] as Array<{ handlers: Record<string, (...a: unknown[]) => void>; started: boolean; mode?: string; stopped: boolean; removed: unknown[]; snapshot: unknown[] }>,
    markers: [] as Array<{ lngLat?: [number, number]; removed: boolean; el: HTMLElement }>,
  };
  return state;
});

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));
vi.mock("maplibre-gl", () => {
  class GLMap {
    options: Record<string, unknown>;
    handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
    sources: Record<string, { data: unknown; setData: (d: unknown) => void }> = {};
    layers: Array<Record<string, unknown>> = [];
    zoom = 0;
    removed = false;
    constructor(options: Record<string, unknown>) {
      this.options = options;
      gl.maps.push(this as unknown as Record<string, unknown>);
    }
    on(ev: string, a: unknown, b?: unknown) {
      const fn = (typeof a === "function" ? a : b) as (...x: unknown[]) => void;
      (this.handlers[ev] ??= []).push(fn);
    }
    fire(ev: string, ...args: unknown[]) {
      (this.handlers[ev] ?? []).forEach((f) => f(...args));
    }
    getSource(id: string) {
      return this.sources[id];
    }
    addSource(id: string, spec: { data: unknown }) {
      this.sources[id] = { data: spec.data, setData: (d) => (this.sources[id]!.data = d) };
    }
    addLayer(l: Record<string, unknown>) {
      this.layers.push(l);
    }
    queryRenderedFeatures() {
      return [{ properties: { id: "DMK-02" } }];
    }
    getCanvas() {
      return { style: {} as Record<string, string> };
    }
    fitBounds = vi.fn();
    zoomIn() {
      this.zoom += 1;
    }
    zoomOut() {
      this.zoom -= 1;
    }
    remove() {
      this.removed = true;
    }
  }
  class Marker {
    rec: { lngLat?: [number, number]; removed: boolean; el: HTMLElement };
    constructor(o: { element: HTMLElement }) {
      this.rec = { removed: false, el: o.element };
      gl.markers.push(this.rec);
    }
    setLngLat(p: [number, number]) {
      this.rec.lngLat = p;
      return this;
    }
    addTo() {
      return this;
    }
    remove() {
      this.rec.removed = true;
    }
  }
  return { Map: GLMap, Marker };
});
vi.mock("terra-draw", () => {
  class TerraDraw {
    rec: (typeof gl.draws)[number] = { handlers: {}, started: false, stopped: false, removed: [], snapshot: [] };
    constructor() {
      gl.draws.push(this.rec);
    }
    start() {
      this.rec.started = true;
    }
    stop() {
      this.rec.stopped = true;
    }
    setMode(m: string) {
      this.rec.mode = m;
    }
    on(ev: string, fn: (...a: unknown[]) => void) {
      this.rec.handlers[ev] = fn;
    }
    getSnapshotFeature(id: string) {
      return this.rec.snapshot.find((f) => (f as { id: string }).id === id);
    }
    getSnapshot() {
      return this.rec.snapshot;
    }
    removeFeatures(ids: unknown[]) {
      this.rec.removed.push(...ids);
    }
  }
  class TerraDrawPolygonMode {
    options: unknown;
    constructor(o: unknown) {
      this.options = o;
    }
  }
  return { TerraDraw, TerraDrawPolygonMode };
});
vi.mock("terra-draw-maplibre-gl-adapter", () => ({ TerraDrawMapLibreGLAdapter: class {} }));

import { MapView, Legend } from "@/components/Map";
import { ParcelTile } from "@/components/ParcelTile";
import { SelectGroup } from "@/components/Choice";
import { IconSprite } from "@/components/icons/sprite";

const square = (x: number, y: number, s = 0.01): PolygonGeometry => ({
  type: "Polygon",
  coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]],
});

const parcels = [
  { id: "DMK-01", geometry: square(110.7, -6.9), status: "insured" as const, selected: true, label: "DMK-01 · Karanganyar Utara" },
  { id: "DMK-02", geometry: square(110.72, -6.9), status: "risk" as const, label: "DMK-02 · Karanganyar Selatan" },
  { id: "DMK-05", geometry: square(110.7, -6.92), status: "off" as const },
];

describe("map geometry", () => {
  it("stretchProjection maps the bounds corners to the frame corners (north up)", () => {
    const p = stretchProjection([100, -10, 110, 0], 800, 520);
    expect(p(100, 0)).toEqual([0, 0]);
    expect(p(110, -10)).toEqual([800, 520]);
    expect(p(105, -5)).toEqual([400, 260]);
  });

  it("fitProjection keeps the shape: a square on the ground stays a square, centred, inside the padding", () => {
    const ring = square(110, -7, 0.1).coordinates[0]!;
    const p = fitProjection(boundsOf([ring]), 800, 520, 0.1);
    const [x0, y0] = p(110, -7);
    const [x1, y1] = p(110.1, -6.9);
    const w = x1 - x0;
    const h = y0 - y1;
    // longitude shrinks with cos(latitude), so on the ground the box is 0.1 * cos(7 deg) wide and 0.1 tall
    expect(w / h).toBeCloseTo(Math.cos((6.95 * Math.PI) / 180), 2);
    expect((x0 + x1) / 2).toBeCloseTo(400, 3);
    expect((y0 + y1) / 2).toBeCloseTo(260, 3);
    expect(Math.min(x0, y1)).toBeGreaterThanOrEqual(0);
  });

  it("ringPoints and thumbPoints produce SVG point lists; thumbnails stay inside 44 x 44", () => {
    expect(ringPoints([[0, 0], [1, 1]], stretchProjection([0, 0, 1, 1], 10, 10))).toBe("0,10 10,0");
    const pts = thumbPoints(square(110, -7).coordinates[0]!).split(" ").map((s) => s.split(",").map(Number));
    expect(pts).toHaveLength(4); // the repeated closing position is dropped
    for (const [x, y] of pts) {
      expect(x!).toBeGreaterThanOrEqual(0);
      expect(x!).toBeLessThanOrEqual(44);
      expect(y!).toBeGreaterThanOrEqual(0);
      expect(y!).toBeLessThanOrEqual(44);
    }
  });
});

describe("map config (D-13)", () => {
  it("defaults to the schematic renderer", () => {
    expect(mapConfig({})).toEqual({ renderer: "schematic", styleUrl: undefined });
  });

  it("maplibre needs a style URL; without one the schematic renderer is used and the reason is given", () => {
    const cfg = mapConfig({ NEXT_PUBLIC_MAP_RENDERER: "maplibre" });
    const r = resolveRenderer(cfg.renderer, cfg.styleUrl);
    expect(r.renderer).toBe("schematic");
    expect(r.reason).toMatch(/NEXT_PUBLIC_MAP_STYLE_URL/);
    expect(resolveRenderer("maplibre", "https://example.test/style.json")).toEqual({ renderer: "maplibre" });
    expect(mapConfig({ NEXT_PUBLIC_MAP_RENDERER: "maplibre", NEXT_PUBLIC_MAP_STYLE_URL: " https://example.test/s.json " }).styleUrl).toBe("https://example.test/s.json");
  });
});

describe("Map, schematic renderer", () => {
  it("draws one polygon per parcel in status colours, the selected one with an ink outline", () => {
    const { container } = render(
      <MapView
        renderer="schematic"
        parcels={parcels}
        places={[{ text: "Demak", lng: 110.71, lat: -6.91 }]}
        bounds={[110.69, -6.94, 110.74, -6.89]}
        ariaLabel="Schematic map of Demak with three parcels"
        backdrop={<path d="M0 0" fill="var(--map-water)" data-testid="backdrop" />}
      />,
    );
    expect(container.querySelector(".map")).toHaveStyle({ height: "360px" });
    const svg = screen.getByRole("img", { name: "Schematic map of Demak with three parcels" });
    expect(svg).toHaveClass("map-svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 800 520");
    const polys = [...container.querySelectorAll("polygon")];
    expect(polys).toHaveLength(3);
    const byFill = Object.fromEntries(polys.map((p) => [p.getAttribute("fill"), p]));
    expect(byFill["var(--parcel)"]).toHaveAttribute("stroke", "var(--ink)");
    expect(byFill["var(--parcel)"]).toHaveAttribute("stroke-width", "3");
    expect(byFill["var(--parcel-risk)"]).toHaveAttribute("stroke", "var(--white)");
    expect(byFill["var(--parcel-off)"]).toBeDefined();
    expect(container.querySelector("text.map-label")).toHaveTextContent("Demak");
    expect(screen.getByTestId("backdrop")).toBeInTheDocument();
  });

  it("zoom buttons change the view box and stop at the limits", async () => {
    render(<MapView renderer="schematic" parcels={parcels} ariaLabel="map" />);
    const svg = screen.getByRole("img");
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    const vb = svg.getAttribute("viewBox")!.split(" ").map(Number);
    expect(vb[2]).toBeCloseTo(800 / 1.5, 3);
    expect(vb[0]).toBeCloseTo((800 - 800 / 1.5) / 2, 3);
    for (let i = 0; i < 10; i++) await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(Number(svg.getAttribute("viewBox")!.split(" ")[2])).toBeCloseTo(200, 3);
    for (let i = 0; i < 12; i++) await userEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(svg.getAttribute("viewBox")).toBe("0 0 800 520");
  });

  it("the layers button only exists when asked for", async () => {
    const onLayers = vi.fn();
    const { rerender } = render(<MapView renderer="schematic" ariaLabel="map" />);
    expect(screen.queryByRole("button", { name: "Layers" })).toBeNull();
    rerender(<MapView renderer="schematic" ariaLabel="map" onLayers={onLayers} />);
    await userEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(onLayers).toHaveBeenCalled();
    rerender(<MapView renderer="schematic" ariaLabel="map" controls={false} />);
    expect(document.querySelector(".map-ctrl")).toBeNull();
  });

  it("parcels are keyboard-operable buttons when selection is wanted", async () => {
    const onSelectParcel = vi.fn();
    render(<MapView renderer="schematic" parcels={parcels} ariaLabel="Parcels" onSelectParcel={onSelectParcel} />);
    const p2 = screen.getByRole("button", { name: "DMK-02 · Karanganyar Selatan" });
    expect(p2).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "DMK-01 · Karanganyar Utara" })).toHaveAttribute("aria-pressed", "true");
    p2.focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelectParcel).toHaveBeenCalledWith("DMK-02");
    fireEvent.click(screen.getByRole("button", { name: "DMK-05" }));
    expect(onSelectParcel).toHaveBeenCalledWith("DMK-05");
  });

  it("falls back to the schematic renderer when maplibre is asked for without a style URL", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<MapView renderer="maplibre" parcels={parcels} ariaLabel="map" />);
    expect(screen.getByRole("img")).toHaveClass("map-svg");
    expect(gl.maps).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("NEXT_PUBLIC_MAP_STYLE_URL"));
    warn.mockRestore();
  });
});

describe("Map, maplibre renderer", () => {
  beforeEach(() => {
    gl.maps.length = 0;
    gl.draws.length = 0;
    gl.markers.length = 0;
  });

  type FakeMap = {
    options: { style: string; bounds?: unknown };
    sources: Record<string, { data: { features: unknown[] } }>;
    layers: Array<{ id: string; paint: Record<string, unknown> }>;
    handlers: Record<string, Array<(...a: unknown[]) => void>>;
    fire: (ev: string, ...a: unknown[]) => void;
    zoom: number;
    removed: boolean;
    fitBounds: ReturnType<typeof vi.fn>;
  };
  const fake = () => gl.maps[0] as unknown as FakeMap;

  async function mount(extra: Partial<React.ComponentProps<typeof MapView>> = {}) {
    const utils = render(
      <MapView
        renderer="maplibre"
        styleUrl="https://styles.example.test/aigri.json"
        parcels={parcels}
        places={[{ text: "Demak", lng: 110.71, lat: -6.91 }]}
        ariaLabel="Map of Demak"
        {...extra}
      />,
    );
    await waitFor(() => expect(gl.maps).toHaveLength(1));
    return utils;
  }

  it("creates the map with the configured style, fits the parcels, and adds them as a layer after load", async () => {
    await mount();
    const m = fake();
    expect(m.options.style).toBe("https://styles.example.test/aigri.json");
    expect(m.options.bounds).toBeDefined();
    expect(screen.getByRole("region", { name: "Map of Demak" })).toBeInTheDocument();
    expect(m.sources["aigri-parcels"]).toBeUndefined(); // waits for the style
    act(() => m.fire("load"));
    expect(m.sources["aigri-parcels"]!.data.features).toHaveLength(3);
    expect(m.layers.map((l) => l.id)).toEqual(["aigri-parcels-fill", "aigri-parcels-line"]);
    expect(gl.markers.map((k) => k.lngLat)).toEqual([[110.71, -6.91]]);
    expect(gl.markers[0]!.el).toHaveTextContent("Demak");
  });

  it("zoom buttons drive the map, a click on a parcel reports it, and the map is removed on unmount", async () => {
    const onSelectParcel = vi.fn();
    const { unmount } = await mount({ onSelectParcel });
    const m = fake();
    act(() => m.fire("load"));
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(m.zoom).toBe(1);
    act(() => (m.handlers.click ?? []).forEach((h) => h({ point: { x: 1, y: 1 } })));
    expect(onSelectParcel).toHaveBeenCalledWith("DMK-02");
    unmount();
    expect(m.removed).toBe(true);
    expect(gl.markers[0]!.removed).toBe(true);
  });

  it("updates the source in place when the parcels change", async () => {
    const { rerender } = await mount();
    const m = fake();
    act(() => m.fire("load"));
    rerender(
      <MapView renderer="maplibre" styleUrl="https://styles.example.test/aigri.json" parcels={parcels.slice(0, 1)} places={[]} ariaLabel="Map of Demak" />,
    );
    expect(m.sources["aigri-parcels"]!.data.features).toHaveLength(1);
    expect(m.layers).toHaveLength(2); // not added twice
  });

  it("Terra Draw: starts polygon mode when drawing is enabled and hands back the finished boundary", async () => {
    const onPolygon = vi.fn();
    await mount({ parcels: [], places: [], drawing: { enabled: true, onPolygon } });
    expect(gl.draws).toHaveLength(0); // waits for the style
    act(() => fake().fire("load"));
    expect(gl.draws).toHaveLength(1);
    const draw = gl.draws[0]!;
    expect(draw.started).toBe(true);
    expect(draw.mode).toBe("polygon");

    const first = { id: "a", geometry: square(110.7, -6.9) };
    const second = { id: "b", geometry: square(110.71, -6.9) };
    draw.snapshot = [first, second];
    act(() => draw.handlers.finish!("b"));
    expect(onPolygon).toHaveBeenCalledWith(second.geometry);
    expect(draw.removed).toEqual(["a"]); // one boundary at a time
  });

  it("Terra Draw: does not start while drawing is off, and stops when switched off", async () => {
    const onPolygon = vi.fn();
    const { rerender } = await mount({ drawing: { enabled: false, onPolygon } });
    act(() => fake().fire("load"));
    expect(gl.draws).toHaveLength(0);
    rerender(
      <MapView renderer="maplibre" styleUrl="https://styles.example.test/aigri.json" parcels={parcels} ariaLabel="Map of Demak" drawing={{ enabled: true, onPolygon }} />,
    );
    expect(gl.draws).toHaveLength(1);
    rerender(
      <MapView renderer="maplibre" styleUrl="https://styles.example.test/aigri.json" parcels={parcels} ariaLabel="Map of Demak" drawing={{ enabled: false, onPolygon }} />,
    );
    expect(gl.draws[0]!.stopped).toBe(true);
  });

  it("Terra Draw: a new resetKey restarts drawing with a clean slate", async () => {
    const onPolygon = vi.fn();
    const props = { renderer: "maplibre" as const, styleUrl: "https://styles.example.test/aigri.json", parcels: [], ariaLabel: "m" };
    const { rerender } = render(<MapView {...props} drawing={{ enabled: true, onPolygon, resetKey: 1 }} />);
    await waitFor(() => expect(gl.maps).toHaveLength(1));
    act(() => fake().fire("load"));
    rerender(<MapView {...props} drawing={{ enabled: true, onPolygon, resetKey: 2 }} />);
    expect(gl.draws).toHaveLength(2);
    expect(gl.draws[0]!.stopped).toBe(true);
  });
});

describe("Legend and ParcelTile", () => {
  it("Legend maps token names to custom properties and accepts raw colours", () => {
    const { container } = render(<Legend items={[{ label: "Insured parcel", color: "parcel" }, { label: "Custom", color: "#112233" }]} />);
    const sw = container.querySelectorAll(".legend .swatch");
    expect(sw[0]).toHaveStyle({ "--c": "var(--parcel)" });
    expect(sw[1]).toHaveStyle({ "--c": "#112233" });
    expect(screen.getByText("Insured parcel")).toBeInTheDocument();
  });

  it("ParcelTile shows its shape, details and status, and joins a SelectGroup", async () => {
    const ring = square(110, -7).coordinates[0]!;
    const { container } = render(
      <>
        <IconSprite />
        <SelectGroup defaultValue="a">
          <ParcelTile value="a" href="#a" ring={ring} title="DMK-01 · Karanganyar Utara" meta="9,6 ha" status={<span className="pill pill-pending">Not insured yet</span>} />
          <ParcelTile value="b" href="#b" ring={ring} tone="risk" title="DMK-02" />
        </SelectGroup>
      </>,
    );
    const tiles = container.querySelectorAll("a.parcel-tile");
    expect(tiles[0]).toHaveClass("is-sel");
    expect(tiles[0]).toHaveAttribute("aria-current", "true");
    expect(tiles[0]!.querySelector(".parcel-thumb svg polygon")).toHaveAttribute("fill", "var(--parcel)");
    expect(tiles[1]!.querySelector("polygon")).toHaveAttribute("fill", "var(--parcel-risk)");
    expect(screen.getByText("Not insured yet")).toHaveClass("pill");
    await userEvent.click(tiles[1]!);
    expect(tiles[1]).toHaveClass("is-sel");
    expect(tiles[0]).not.toHaveClass("is-sel");
  });
});
