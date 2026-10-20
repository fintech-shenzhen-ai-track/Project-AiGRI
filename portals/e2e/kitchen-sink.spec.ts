import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { REPO_ROOT, startProtoServer } from "./support/proto-server";

// T-03.14 / US-03.1: /dev/kitchen-sink reproduces system-preview/shared/_kitchen-sink.html with the React components.
// Checked three ways: every class the prototype uses is rendered, the page looks like the prototype (pixel
// comparison in still mode), and it is accessible and behaves (axe, one yellow button, dialogs, tabs, motion).

const PROTO_FILE = path.join(REPO_ROOT, "system-preview/shared/_kitchen-sink.html");
const URL_PATH = "/dev/kitchen-sink";

let proto: Awaited<ReturnType<typeof startProtoServer>>;
test.beforeAll(async () => {
  proto = await startProtoServer();
});
test.afterAll(async () => {
  await proto.close();
});

/** Class tokens written in the prototype's markup (the part before its <script>), minus the page-local `kit-*`. */
function prototypeClasses(): Set<string> {
  const html = readFileSync(PROTO_FILE, "utf8").split("<script")[0] ?? "";
  const out = new Set<string>();
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const tok of (m[1] ?? "").split(/\s+/)) if (tok) out.add(tok);
  }
  return out;
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Lazy images and fonts: make both pages be captured in the same state.
  await page.evaluate(async () => {
    for (const img of Array.from(document.images)) img.loading = "eager";
    await Promise.all(Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = () => r(null); }))));
  });
}

/** The full page as one image, captured in bands: one 25,000 px screenshot can exhaust the browser's memory. */
async function captureTiled(page: Page): Promise<PNG> {
  const { width, height } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  const out = new PNG({ width, height });
  const BAND = 3000;
  for (let y = 0; y < height; y += BAND) {
    const h = Math.min(BAND, height - y);
    const tile = PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled", clip: { x: 0, y, width, height: h } }));
    PNG.bitblt(tile, out, 0, 0, tile.width, tile.height, 0, y);
  }
  return out;
}

test.describe("kitchen sink", () => {
  test("renders every class the prototype uses", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const rendered = await page.evaluate(() => {
      const set = new Set<string>();
      document.querySelectorAll("[class]").forEach((el) => el.classList.forEach((c) => set.add(c)));
      return Array.from(set);
    });
    const have = new Set(rendered);
    // Page-local kitchen-sink classes are part of the page's own stylesheet; the rest come from system.css.
    const want = [...prototypeClasses()];
    const missing = want.filter((c) => !have.has(c));
    // Classes that only exist while something is running in the prototype's script, or that mark the demo photos
    // (the React page draws placeholder scenes instead of the prototype's jpg files).
    const allowed = new Set(["kit-photo"]);
    expect(missing.filter((c) => !allowed.has(c)), "classes in the prototype that the React page does not render").toEqual([]);
  });

  for (const width of [1280, 390]) {
    test(`looks like the prototype at ${width}px (still mode)`, async ({ browser }, testInfo) => {
      test.skip(testInfo.project.use.viewport?.width !== width, "runs once per viewport project");
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      const mask = `.photo > *, .settle-box`; // the demo photos are placeholder scenes in the React page (the prototype uses jpg files)
      const shoot = async (url: string) => {
        await page.goto(url, { waitUntil: "networkidle" });
        await settle(page);
        await page.addStyleTag({ content: `${mask}{visibility:hidden!important}` });
        return captureTiled(page);
      };
      const original = await shoot(`${proto.origin}/system-preview/shared/_kitchen-sink.html?still`);
      const ported = await shoot(`${testInfo.project.use.baseURL}${URL_PATH}?still`);
      await ctx.close();

      const w = Math.min(original.width, ported.width);
      const h = Math.min(original.height, ported.height);
      const crop = (p: PNG) => {
        const out = new PNG({ width: w, height: h });
        PNG.bitblt(p, out, 0, 0, w, h, 0, 0);
        return out;
      };
      const a = crop(original);
      const b = crop(ported);
      const diff = new PNG({ width: w, height: h });
      const mismatched = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 });
      const ratio = mismatched / (w * h);
      const out = path.join(import.meta.dirname, "__out__");
      mkdirSync(out, { recursive: true });
      writeFileSync(path.join(out, `kitchen-sink-${width}-diff.png`), PNG.sync.write(diff));
      console.log(`kitchen sink @${width}: ${(ratio * 100).toFixed(2)}% differing pixels, heights ${original.height} vs ${ported.height}`);
      // Plan: a diff over 5% on the kitchen sink fails the build.
      expect(Math.abs(original.height - ported.height) / original.height, "page height").toBeLessThan(0.02);
      expect(ratio, "share of differing pixels").toBeLessThan(0.05);
    });
  }

  // Colour pairs in the approved design tokens that fall just under 4.5:1 for 15px text. They come from
  // DESIGN.md / system.css as designed (not from the React components) and are raised as a decision for the design
  // owner (proposed: --muted-2 #646F5E, opaque white on the wallet hero). Any other contrast failure fails the test.
  const KNOWN_TOKEN_CONTRAST = new Set([
    "#6b7766/#f5f5f7", // --muted-2 on --surface-2 (4.32)
    "#6b7766/#fff8e1", // --muted-2 on --cream (4.43)
    "#e7ece5/#557945", // 86% white on --green in .wallet-hero (4.16)
    "#ffffff/#5d9253", // white label on the --leaf swatch of the colour chart
    "#ffffff/#c8693a", // white label on the --parcel-risk swatch of the colour chart
  ]);

  test("has no serious or critical axe violations", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const bad: string[] = [];
    for (const v of results.violations) {
      if (v.impact !== "serious" && v.impact !== "critical") continue;
      for (const n of v.nodes) {
        if (v.id === "color-contrast") {
          const msg = n.any[0]?.message ?? "";
          const pair = /foreground color: (#[0-9a-f]{6}), background color: (#[0-9a-f]{6})/i.exec(msg);
          if (pair && KNOWN_TOKEN_CONTRAST.has(`${pair[1]!.toLowerCase()}/${pair[2]!.toLowerCase()}`)) continue;
        }
        bad.push(`${v.id}: ${n.target.join(" ")}`);
      }
    }
    expect(bad).toEqual([]);
  });

  test("shows exactly one yellow button", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    expect(await page.locator(".btn-y").count()).toBe(1);
  });

  test("tabs: arrow keys move the selection and the panel follows", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const all = page.getByRole("tab", { name: /^All/ });
    await all.focus();
    await page.keyboard.press("ArrowRight");
    const open = page.getByRole("tab", { name: /^Open/ });
    await expect(open).toHaveAttribute("aria-selected", "true");
    await expect(open).toBeFocused();
    await expect(page.getByText("Open claims panel.")).toBeVisible();
    // the ink bar sits under the selected tab
    const [ink, tab] = await Promise.all([page.locator(".tabs-ink").boundingBox(), open.boundingBox()]);
    expect(ink).not.toBeNull();
    expect(tab).not.toBeNull();
    expect(ink!.x).toBeGreaterThan(tab!.x - 1);
    expect(ink!.x + ink!.width).toBeLessThan(tab!.x + tab!.width + 1);
  });

  test("sheet: opens from a clause chip, Esc closes it, focus goes back to the chip", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const chip = page.getByRole("button", { name: "Clause 4.1" }).first();
    await chip.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Clause 4.1" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/has-dialog/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(chip).toBeFocused();
    await expect(page.locator("html")).not.toHaveClass(/has-dialog/);
  });

  test("modal: Pay now closes it and raises a toast", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open modal" }).click();
    const dialog = page.getByRole("dialog", { name: /^Pay .* from your wallet\?$/ }).last();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Pay now" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".toast-region .toast")).toContainText("Policy issued. POL-JSD-26-004127.");
  });

  test("toasts: at most three at once", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const btn = page.getByRole("button", { name: "Toast ok" });
    for (let i = 0; i < 5; i++) await btn.click();
    await expect(page.locator(".toast-region .toast")).toHaveCount(3);
  });

  test("disclosure toggles; charts offer a table; stepper moves", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const q = page.getByText("Am I covered if a levee breaks?");
    await q.click();
    await expect(page.getByText("Flood from river overflow or levee failure")).toBeVisible();

    const show = page.getByRole("button", { name: "Show as table" });
    await expect(page.locator("table.chart-table")).toBeHidden();
    await show.click();
    await expect(page.locator("table.chart-table")).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).last().click();
    await expect(page.locator(".step.is-now .step-label")).toHaveText("Business details");
    await expect(page.getByRole("heading", { name: "Step 3 · Business details" })).toBeFocused();
  });

  test("pack formatting reaches the page (nothing is typed in components)", async ({ page }) => {
    await page.goto(`${URL_PATH}?still`, { waitUntil: "networkidle" });
    const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    expect(text).toContain("Rp199.360.000");
    expect(text).toContain("9,6 ha");
    expect(text).toContain("16 Feb 2026, 08:20 WIB");
    expect(text).toContain("Rp412,6 jt");
  });

  test("without ?still and with reduced motion, revealed content is visible", async ({ page }) => {
    await page.goto(URL_PATH, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/\bjs\b/);
    await expect(page.locator("html")).not.toHaveAttribute("data-still", "");
    const title = page.getByRole("heading", { level: 1, name: "Kitchen sink" });
    await expect(title).toHaveClass(/\bin\b/);
    await expect.poll(async () => Number(await title.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  });
});
