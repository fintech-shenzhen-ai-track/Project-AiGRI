import { expect, test } from "@playwright/test";

// T-03.03 / FR-03.7: role guards in middleware.ts. Uses the stand-in API (e2e/support/fake-api.mjs).
test.skip(!!process.env.E2E_BASE_URL, "needs the stand-in API cookie `fake_session`");

const as = (role: string) => ({ cookie: `fake_session=${role}` });

test("no session on a portal route redirects to sign-in and remembers where you were", async ({ request }) => {
  const res = await request.get("/client/claims/CLM-26-000418?tab=packet", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(new URL(res.headers().location ?? "", "http://x").pathname).toBe("/sign-in");
  expect(new URL(res.headers().location ?? "", "http://x").searchParams.get("next")).toBe("/client/claims/CLM-26-000418?tab=packet");
});

test.describe("wrong role goes to the user's own home with a notice", () => {
  const cases: [string, string, string][] = [
    ["client_owner", "/insurer/dashboard", "/client/home"],
    ["client_owner", "/admin/overview", "/client/home"],
    ["underwriter_adjuster", "/client/wallet", "/insurer/dashboard"],
    ["finance", "/admin/audit", "/insurer/dashboard"],
    ["superadmin", "/client/home", "/admin/overview"],
    ["superadmin", "/insurer/claims", "/admin/overview"],
  ];
  for (const [role, url, home] of cases) {
    test(`${role} -> ${url}`, async ({ request }) => {
      const res = await request.get(url, { headers: as(role), maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(new URL(res.headers().location ?? "", "http://x").pathname).toBe(home);
      expect(res.headers()["set-cookie"] ?? "").toContain("aigri_flash=wrong_portal");
    });
  }
});

test("the right role is let through (the page itself does not exist yet, so Next answers 404, not a redirect)", async ({ request }) => {
  const res = await request.get("/client/home", { headers: as("client_owner"), maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

test("public routes need no session", async ({ request }) => {
  expect((await request.get("/sign-in", { maxRedirects: 0 })).status()).toBe(200);
  expect((await request.get("/health", { maxRedirects: 0 })).status()).toBe(200);
});

test("/api/v1 is proxied to the API at request time", async ({ request }) => {
  const res = await request.get("/api/v1/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).via).toBe("fake-api");
  const me = await request.get("/api/v1/auth/me", { headers: as("underwriter_adjuster") });
  expect((await me.json()).insurer.name).toBe("Asuransi Jasindo");
  expect((await request.get("/api/v1/auth/me")).status()).toBe(401);
});
