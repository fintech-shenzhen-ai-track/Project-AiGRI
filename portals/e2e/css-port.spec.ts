import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { startProtoServer } from "./support/proto-server";

// T-03.02 / FR-03.1: prototype pages rendered with the ported stylesheet and the React icon sprite must look
// identical to the same pages rendered by the prototype's own system.css and system.js ("side by side").
// Both sides run in still mode (?still) in the same browser, so the comparison is pixel for pixel.

const PAGES = [
  "client/01-sign-in.html",
  "client/03-parcels.html",
  "client/06-policies.html",
  "client/09-home.html",
  "client/13-wallet.html",
  "insurer/01-dashboard.html",
  "insurer/04-claim-review.html",
  "admin/01-overview.html",
  "shared/_kitchen-sink.html",
];

let server: Awaited<ReturnType<typeof startProtoServer>>;
test.beforeAll(async () => {
  server = await startProtoServer();
});
test.afterAll(async () => {
  await server.close();
});

async function shoot(page: Page, url: string): Promise<PNG> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Lazy images only load when scrolled near; load them all so both sides are captured in the same state.
  await page.evaluate(async () => {
    for (const img of Array.from(document.images)) img.loading = "eager";
    await Promise.all(
      Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = () => r(null); }))),
    );
  });
  return PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled" }));
}

for (const proto of PAGES) {
  test(`ported system.css + sprite match the prototype: ${proto}`, async ({ browser }, testInfo) => {
    const ctx = await browser.newContext({ viewport: testInfo.project.use.viewport ?? undefined, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const original = await shoot(page, `${server.origin}/system-preview/${proto}?still`);
    const ported = await shoot(page, `${server.origin}/__port__/${proto}?still`);
    await ctx.close();

    expect(ported.width, "page width").toBe(original.width);
    expect(ported.height, "page height").toBe(original.height);
    const diff = new PNG({ width: original.width, height: original.height });
    const mismatched = pixelmatch(original.data, ported.data, diff.data, original.width, original.height, { threshold: 0 });
    if (mismatched > 0) {
      const out = path.join(import.meta.dirname, "__out__");
      mkdirSync(out, { recursive: true });
      writeFileSync(path.join(out, `${proto.replace(/\W+/g, "_")}-${testInfo.project.name}-diff.png`), PNG.sync.write(diff));
    }
    expect(mismatched, "differing pixels").toBe(0);
  });
}
