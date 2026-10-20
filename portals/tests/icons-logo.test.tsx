import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_NAMES, Icon, IconSprite } from "@/components/icons/sprite";
import { LogoHorizontal, LogoSymbol } from "@/components/logo";

const root = path.resolve(import.meta.dirname, "../..");

// PLAN 4.3, in order.
const PLAN_ICONS =
  "home farm parcel cow sprout shield shield-check file file-check file-pen wallet bell settings user users building globe search filter plus minus check x chevron-right chevron-left chevron-down arrow-right arrow-up-right arrow-down-left alert info clock calendar rain rain-alert flood sun thermometer bug camera image upload download satellite layers tag pin bank send scale list activity chart lock eye edit copy external logout hash refresh".split(
    " ",
  );

describe("icon sprite", () => {
  it("holds exactly the PLAN 4.3 icon list", () => {
    expect([...ICON_NAMES].sort()).toEqual([...PLAN_ICONS].sort());
  });

  it("renders one symbol per icon with the shared stroke attributes", () => {
    const { container } = render(<IconSprite />);
    const symbols = container.querySelectorAll("symbol");
    expect(symbols).toHaveLength(PLAN_ICONS.length);
    for (const s of Array.from(symbols)) {
      expect(s.id).toMatch(/^i-/);
      expect(s.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(s.getAttribute("stroke")).toBe("currentColor");
      expect(s.getAttribute("stroke-width")).toBe("2");
    }
  });

  it("Icon renders the same markup as AG.icon()", () => {
    expect(renderToStaticMarkup(<Icon name="bell" size="sm" />)).toContain('class="i i-sm"');
    expect(renderToStaticMarkup(<Icon name="bell" />)).toContain('<use href="#i-bell"');
  });
});

function pathData(svg: string): string[] {
  return [...svg.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1] ?? "");
}

describe("logos", () => {
  const signIn = readFileSync(path.join(root, "system-preview/client/01-sign-in.html"), "utf8");
  const home = readFileSync(path.join(root, "system-preview/client/09-home.html"), "utf8");

  it("horizontal logo paths match the prototype wordmark", () => {
    const proto = /<a class="side-logo"[\s\S]*?<\/a>/.exec(home)?.[0] ?? "";
    expect(pathData(proto).length).toBeGreaterThan(5);
    expect(pathData(renderToStaticMarkup(<LogoHorizontal />))).toEqual(pathData(proto));
  });

  it("reversed logo uses white and the sun yellow, like the sign-in photo", () => {
    const proto = /<div class="si-top"[\s\S]*?<\/svg>/.exec(signIn)?.[0] ?? "";
    const html = renderToStaticMarkup(<LogoHorizontal variant="reversed" height={48} />);
    expect(pathData(html)).toEqual(pathData(proto));
    expect(html).not.toContain("#557945");
    expect(html).not.toContain("#1F2A1B");
  });

  it("symbol has the sun-rise hooks only when asked", () => {
    expect(renderToStaticMarkup(<LogoSymbol />)).not.toContain("sr-row");
    const html = renderToStaticMarkup(<LogoSymbol size={72} sunRise />);
    expect(html).toContain("sun-rise rv");
    expect(html.match(/sr-row/g)).toHaveLength(3);
    expect(html).toContain("sr-sun");
  });
});
