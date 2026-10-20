import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "@/components/Reveal";
import { MOTION_BOOT_SCRIPT, easeInOut, easeOut, isStill, prefersReducedMotion, reducedMotion, tween } from "@/lib/motion";
import { resetRevealObserver } from "@/lib/motion/use-reveal";

const html = document.documentElement;

function runBoot(search: string) {
  html.classList.remove("js");
  html.removeAttribute("data-still");
  vi.stubGlobal("location", { search });
  new Function(MOTION_BOOT_SCRIPT)();
  vi.unstubAllGlobals();
}

describe("boot script (FR-03.3: still mode)", () => {
  afterEach(() => {
    html.classList.remove("js");
    html.removeAttribute("data-still");
  });

  it("adds js, and data-still only when the URL has ?still", () => {
    runBoot("");
    expect(html).toHaveClass("js");
    expect(html).not.toHaveAttribute("data-still");
    runBoot("?still");
    expect(html).toHaveClass("js");
    expect(html).toHaveAttribute("data-still");
    runBoot("?a=1&still");
    expect(html).toHaveAttribute("data-still");
    runBoot("?still=1");
    expect(html).toHaveAttribute("data-still");
    runBoot("?stillness=1");
    expect(html).not.toHaveAttribute("data-still");
  });

  it("isStill and reducedMotion follow html[data-still] and the OS setting", () => {
    expect(isStill()).toBe(false);
    html.setAttribute("data-still", "");
    expect(isStill()).toBe(true);
    expect(reducedMotion()).toBe(true);
    html.removeAttribute("data-still");

    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
    expect(prefersReducedMotion()).toBe(true);
    expect(reducedMotion()).toBe(true);
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q }));
    expect(reducedMotion()).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe("easing and tween", () => {
  it("easings run from 0 to 1", () => {
    for (const f of [easeOut, easeInOut]) {
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
      expect(f(0.5)).toBeGreaterThan(0);
      expect(f(0.5)).toBeLessThan(1);
    }
    expect(easeOut(0.5)).toBeGreaterThan(0.5); // fast start
    expect(easeInOut(0.25)).toBeLessThan(0.25); // slow start
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  });
  afterEach(() => vi.useRealTimers());

  it("tween steps until the end, calls done once, and can be stopped", () => {
    const steps: number[] = [];
    const done = vi.fn();
    tween(100, (p) => p, (v) => steps.push(v), done);
    vi.advanceTimersByTime(300);
    expect(steps.at(-1)).toBe(1);
    expect(steps[0]!).toBeLessThanOrEqual(steps.at(-1)!);
    expect(done).toHaveBeenCalledTimes(1);

    const more: number[] = [];
    const stop = tween(100, (p) => p, (v) => more.push(v));
    vi.advanceTimersByTime(50);
    stop();
    const n = more.length;
    vi.advanceTimersByTime(300);
    expect(more.length).toBe(n);
  });
});

describe("Reveal", () => {
  afterEach(() => {
    resetRevealObserver();
    vi.unstubAllGlobals();
    html.removeAttribute("data-still");
  });

  it("renders its final markup first (no `in`), with stagger and pop variables", () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} });
    render(
      <>
        <Reveal as="h1" className="title" i={2}>
          Heading
        </Reveal>
        <Reveal as="span" kind="pop" delay={200} className="pill">
          Paid
        </Reveal>
      </>,
    );
    const h1 = screen.getByRole("heading");
    expect(h1).toHaveClass("title", "rv");
    expect(h1).not.toHaveClass("in");
    expect(h1).toHaveStyle({ "--i": "2" });
    expect(screen.getByText("Paid")).toHaveClass("pill", "pop");
    expect(screen.getByText("Paid")).toHaveStyle({ "--d": "200ms" });
  });

  it("adds `in` once, when the element is first seen, and stops observing it", () => {
    const unobserve = vi.fn();
    let callback: (entries: unknown[]) => void = () => {};
    let target: Element | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (e: unknown[]) => void) {
          callback = cb;
        }
        observe(el: Element) {
          target = el;
        }
        unobserve = unobserve;
      },
    );
    render(<Reveal>Hello</Reveal>);
    const el = screen.getByText("Hello");
    act(() => callback([{ isIntersecting: false, target }]));
    expect(el).not.toHaveClass("in");
    act(() => callback([{ isIntersecting: true, target }]));
    expect(el).toHaveClass("in");
    expect(unobserve).toHaveBeenCalledWith(target);
  });

  it("in still mode everything is revealed at once", () => {
    html.setAttribute("data-still", "");
    render(<Reveal>Now</Reveal>);
    expect(screen.getByText("Now")).toHaveClass("in");
  });

  it("without IntersectionObserver content is revealed rather than left hidden", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal>Fallback</Reveal>);
    expect(screen.getByText("Fallback")).toHaveClass("in");
  });
});
