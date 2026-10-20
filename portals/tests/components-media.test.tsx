import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SatelliteCompare, SatReadings, RADAR_NOTE } from "@/components/SatelliteCompare";
import { Photo, PhotoGrid } from "@/components/Photo";
import { Consent } from "@/components/Consent";
import { CountUp } from "@/components/CountUp";
import { SunRiseMark } from "@/components/SunRise";
import { IconSprite } from "@/components/icons/sprite";
import { resetRevealObserver } from "@/lib/motion/use-reveal";

const still = () => document.documentElement.setAttribute("data-still", "");

describe("SatelliteCompare", () => {
  const demo = <SatelliteCompare before={<svg data-testid="b" />} after={<svg data-testid="a" />} beforeTag="Before · 2 Feb 2026 · Sentinel-1" afterTag="After · 8 Feb 2026 · Sentinel-1" />;

  it("stacks the layers, shows the tags and starts at the middle in still mode", () => {
    still();
    const { container } = render(demo);
    expect(container.querySelector(".sat-before [data-testid=b]")).not.toBeNull();
    expect(container.querySelector(".sat-after [data-testid=a]")).not.toBeNull();
    expect(screen.getByText(/^Before/)).toHaveClass("sat-tag", "is-before");
    expect(screen.getByText(/^After/)).toHaveClass("sat-tag", "is-after");
    expect(container.querySelector(".sat")).toHaveStyle({ "--x": "50%" });
    const range = screen.getByRole("slider", { name: "Compare before and after" });
    expect(range).toHaveValue("50");
    expect(container.querySelector(".sat-handle")).toHaveAttribute("aria-hidden", "true");
  });

  it("moves the divider with the slider and keeps it where the person put it", () => {
    still();
    const { container } = render(demo);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "20" } });
    expect(container.querySelector(".sat")).toHaveStyle({ "--x": "20%" });
  });

  describe("with motion", () => {
    beforeEach(() => {
      resetRevealObserver();
      vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          cb: (e: unknown[]) => void;
          constructor(cb: (e: unknown[]) => void) {
            this.cb = cb;
            observers.push(this);
          }
          observe(el: Element) {
            this.el = el;
          }
          unobserve() {}
          el?: Element;
        },
      );
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    });
    afterEach(() => {
      resetRevealObserver();
      vi.useRealTimers();
      vi.unstubAllGlobals();
      observers.length = 0;
    });
    const observers: Array<{ cb: (e: unknown[]) => void; el?: Element }> = [];

    it("starts at the right edge and sweeps once to the middle when first seen", () => {
      const { container } = render(demo);
      const sat = container.querySelector(".sat")!;
      expect(sat).toHaveStyle({ "--x": "100%" });
      act(() => observers[0]!.cb([{ isIntersecting: true, target: sat }]));
      expect(sat).toHaveClass("in");
      act(() => {
        vi.advanceTimersByTime(900);
      });
      const mid = parseFloat(sat.getAttribute("style")!.match(/--x:\s*([\d.]+)%/)![1]!);
      expect(mid).toBeLessThan(100);
      expect(mid).toBeGreaterThan(50);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(sat).toHaveStyle({ "--x": "50%" });
    });
  });
});

describe("SatReadings", () => {
  it("prints figures in bold, takes elements as they are and adds the radar note for a low reading", () => {
    const { container, rerender } = render(
      <SatReadings readings={[{ label: "Flooded", value: "92%" }, { label: "Confidence", value: <span className="pill pill-ok">High</span> }]} />,
    );
    expect(screen.getByText("92%").tagName).toBe("B");
    expect(screen.getByText("High")).toHaveClass("pill-ok");
    expect(container.querySelectorAll(".reading")).toHaveLength(2);
    expect(screen.queryByText(RADAR_NOTE)).toBeNull();
    rerender(<SatReadings lowReading readings={[{ label: "Flooded", value: "0%" }]} />);
    expect(screen.getByText("Radar can miss water under dense rice. This does not close the claim.")).toBeInTheDocument();
  });
});

describe("Photo", () => {
  it("renders a lazy image with an evidence chip, or an SVG scene", () => {
    const { container } = render(
      <PhotoGrid>
        <Photo src="/evidence/1.jpg" alt="Cattle at the shed" chip="14 Feb 2026, 07:12" objectPosition="50% 55%" />
        <Photo chip="Tag read">
          <svg data-testid="scene" />
        </Photo>
      </PhotoGrid>,
    );
    expect(container.querySelector(".photo-grid")).not.toBeNull();
    const img = screen.getByAltText("Cattle at the shed");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveStyle({ objectPosition: "50% 55%" });
    expect(screen.getByText("14 Feb 2026, 07:12")).toHaveClass("photo-chip");
    expect(screen.getByTestId("scene").parentElement).toHaveClass("photo");
  });
});

describe("Consent", () => {
  it("states what is shared, shows the hash and reports the checkbox", async () => {
    const onCheckedChange = vi.fn();
    render(
      <Consent title="What you share with the insurer" hash="a91c3f0e…77e3" label="I agree to share this data." onCheckedChange={onCheckedChange}>
        Your business name and the parcel boundaries. Nothing else.
      </Consent>,
    );
    expect(screen.getByText("Your business name and the parcel boundaries. Nothing else.")).toHaveClass("small");
    expect(screen.getByText("a91c3f0e…77e3")).toHaveClass("hash");
    expect(screen.queryByRole("button")).toBeNull(); // no copy button on a consent hash
    const box = screen.getByRole("checkbox", { name: "I agree to share this data." });
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("CountUp", () => {
  const fmt = (v: number) => `#${Math.round(v)}`;

  it("renders the final value (server and still mode)", () => {
    still();
    render(<CountUp to={1500} format={fmt} />);
    expect(screen.getByText("#1500")).toBeInTheDocument();
  });

  describe("with motion", () => {
    beforeEach(() => {
      resetRevealObserver();
      vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: (e: unknown[]) => void) {
            seen.push(cb);
          }
          observe(el: Element) {
            seenEl.push(el);
          }
          unobserve() {}
        },
      );
    });
    afterEach(() => {
      resetRevealObserver();
      vi.useRealTimers();
      vi.unstubAllGlobals();
      seen.length = 0;
      seenEl.length = 0;
    });
    const seen: Array<(e: unknown[]) => void> = [];
    const seenEl: Element[] = [];

    it("shows the start value, then counts to the end value once seen", () => {
      render(<CountUp to={1000} from={200} format={fmt} />);
      expect(screen.getByText("#200")).toBeInTheDocument();
      act(() => seen[0]!([{ isIntersecting: true, target: seenEl[0] }]));
      act(() => {
        vi.advanceTimersByTime(450);
      });
      const mid = Number(screen.getByText(/^#\d+$/).textContent!.slice(1));
      expect(mid).toBeGreaterThan(200);
      expect(mid).toBeLessThan(1000);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(screen.getByText("#1000")).toBeInTheDocument();
    });
  });
});

describe("SunRiseMark", () => {
  it("renders the symbol with the sun-rise classes and an accessible name", () => {
    still();
    const { container } = render(
      <>
        <IconSprite />
        <SunRiseMark />
      </>,
    );
    const svg = screen.getByRole("img", { name: "AiGRI symbol" });
    expect(svg).toHaveClass("sun-rise", "rv", "in");
    expect(svg).toHaveAttribute("width", "72");
    expect(container.querySelectorAll(".sr-row")).toHaveLength(3);
    expect(container.querySelectorAll(".sr-sun")).toHaveLength(1);
  });
});
