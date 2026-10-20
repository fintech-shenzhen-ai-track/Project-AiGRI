import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("placeholder sign-in page loads and passes axe", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious).toEqual([]);
});

test("the global stylesheet and the icon sprite are applied", async ({ page }) => {
  await page.goto("/sign-in");
  const body = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return { size: cs.fontSize, color: cs.color, symbols: document.querySelectorAll("#ag-sprite symbol").length };
  });
  expect(body.size).toBe("17px");
  expect(body.color).toBe("rgb(31, 42, 27)");
  expect(body.symbols).toBe(61);
});

test("health endpoint answers ok", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ status: "ok" });
});
