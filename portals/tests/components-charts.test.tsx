import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BarChart, LineChart, ShowAsTable, Sparkline, StackedBarChart } from "@/components/Chart";

describe("BarChart", () => {
  const data = [
    { label: "DMK-01", value: 31, display: "31%", tone: "risk" as const },
    { label: "DMK-02", value: 28, display: "28%", tone: "risk" as const },
    { label: "DMK-03", value: 24, display: "24%", tone: "risk" as const },
    { label: "DMK-04", value: 19, display: "19%" },
    { label: "DMK-05", value: 14, display: "14%" },
    { label: "DMK-06", value: 6, display: "6%" },
  ];

  it("scales bars to the tallest value on a 2px baseline, with direct labels", () => {
    const { container } = render(<BarChart data={data} aria-label="Flood chance by parcel" />);
    const svg = screen.getByRole("img", { name: "Flood chance by parcel" });
    expect(svg).toHaveClass("chart");
    expect(svg).toHaveAttribute("data-draw");
    const bars = [...container.querySelectorAll("rect.bar")];
    expect(bars.map((b) => Number(b.getAttribute("height")))).toEqual([140, 126, 108, 86, 63, 27]);
    expect(bars.map((b) => Number(b.getAttribute("x")))).toEqual([10, 80, 150, 220, 290, 360]);
    expect(bars[0]).toHaveClass("is-risk", "draw-bar");
    expect(bars[3]).not.toHaveClass("is-risk");
    expect(bars.every((b) => Number(b.getAttribute("y")) + Number(b.getAttribute("height")) === 180)).toBe(true);
    expect([...container.querySelectorAll("text.bar-label")].map((t) => t.textContent)).toEqual(["31%", "28%", "24%", "19%", "14%", "6%"]);
    expect([...container.querySelectorAll("text.axis")].map((t) => t.textContent)).toContain("DMK-06");
    expect(container.querySelector("line.axis")).toBeInTheDocument();
  });

  it("handles an all-zero series without NaN", () => {
    const { container } = render(<BarChart data={[{ label: "a", value: 0, display: "0" }]} aria-label="Zero" />);
    expect(container.querySelector("rect.bar")).toHaveAttribute("height", "0");
  });

  it("is revealed (class in) once seen", () => {
    document.documentElement.setAttribute("data-still", "");
    render(<BarChart data={data} aria-label="x" />);
    expect(screen.getByRole("img")).toHaveClass("in");
  });
});

describe("LineChart", () => {
  const values = [15, 24, 11, 30, 36, 18, 9, 32, 40, 38, 18, 11, 4, 16, 29, 32];

  it("draws a line, an area, a threshold at its value and the ticks", () => {
    const { container } = render(
      <LineChart
        values={values}
        yMax={50}
        threshold={{ value: 50, label: "Heavy-rain level" }}
        xTicks={[{ index: 0, label: "9 Jan" }, { index: 15, label: "24 Jan" }]}
        aria-label="Rain forecast"
      />,
    );
    const th = container.querySelector("line.threshold")!;
    expect(th.getAttribute("y1")).toBe("40"); // 50 of 50 at the top of the plot
    expect(container.querySelector("text.threshold")).toHaveTextContent("Heavy-rain level");
    const line = container.querySelector("path.line")!;
    expect(line).toHaveClass("is-water", "draw-line");
    expect(line).toHaveAttribute("pathLength", "1");
    expect(line.getAttribute("d")!.startsWith("M0 ")).toBe(true);
    expect(line.getAttribute("d")).toContain("420 ");
    const area = container.querySelector("path.area")!;
    expect(area.getAttribute("d")!.startsWith("M0 180")).toBe(true);
    expect(area.getAttribute("d")!.endsWith("420 180Z")).toBe(true);
    expect([...container.querySelectorAll("text.axis")].map((t) => t.textContent)).toEqual(["9 Jan", "24 Jan"]);
  });

  it("works without a threshold and with a single point", () => {
    const { container } = render(<LineChart values={[5]} xTicks={[]} aria-label="One" />);
    expect(container.querySelector("line.threshold")).toBeNull();
    expect(container.querySelector("path.line")!.getAttribute("d")).not.toContain("NaN");
  });
});

describe("StackedBarChart and Sparkline", () => {
  it("splits a bar by share and prints a legend with the counts", () => {
    const { container } = render(
      <StackedBarChart
        aria-label="Open claims by status"
        segments={[
          { label: "Submitted", value: 4, display: "4", tone: "neutral" },
          { label: "Pre-checked", value: 14, display: "14", tone: "info" },
          { label: "Under review", value: 18, display: "18", tone: "ink" },
          { label: "Info requested", value: 5, display: "5", tone: "need" },
        ]}
      />,
    );
    const rects = [...container.querySelectorAll("rect")];
    expect(rects).toHaveLength(4);
    const widths = rects.map((r) => Number(r.getAttribute("width")));
    // 4/41, 14/41, 18/41 of 420 minus the 2px gap; the last has no gap
    expect(widths[1]!).toBeCloseTo((14 / 41) * 420 - 2, 5);
    expect(widths[3]!).toBeCloseTo((5 / 41) * 420, 5);
    expect(rects[2]).toHaveAttribute("fill", "var(--ink)");
    expect(container.querySelectorAll(".legend > span")).toHaveLength(4);
    expect(screen.getByText(/Under review 18/)).toBeInTheDocument();
  });

  it("Sparkline is decorative and maps the highest value to the top", () => {
    const { container } = render(<Sparkline values={[1, 3, 2]} />);
    const svg = container.querySelector("svg.spark")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelector("path")!.getAttribute("d")).toBe("M2 24 60 6 118 15");
  });
});

describe("ShowAsTable", () => {
  it("reveals the accessible twin of the chart", async () => {
    render(
      <ShowAsTable
        headers={["Parcel", "Flood chance"]}
        rows={[
          ["DMK-01", "31%"],
          ["DMK-02", "28%"],
        ]}
      />,
    );
    const btn = screen.getByRole("button", { name: "Show as table" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector("table.chart-table")).toHaveAttribute("hidden");
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    const table = screen.getByRole("table");
    expect(table).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Flood chance" })).toHaveClass("r");
    expect(screen.getByText("DMK-01")).toHaveClass("id");
    expect(screen.getByText("31%")).toHaveClass("num");
  });
});
