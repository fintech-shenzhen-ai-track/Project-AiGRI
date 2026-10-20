import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_NAMES } from "@/components/icons/paths";
import { FLASH_COOKIE, guard } from "@/lib/guard";
import {
  CLIENT_TABS,
  NAV,
  PORTAL_HOME,
  ROLE_PORTAL,
  ROUTES,
  homeForRole,
  isCurrent,
  matchRoute,
  pageKeyFor,
  portalForRole,
  type Role,
} from "@/lib/nav";

const plan = readFileSync(path.resolve(import.meta.dirname, "../../specs/03-ui-shell/plan.md"), "utf8");

/** Every `/path` in the Route column of the plan's route table. */
function planRoutes(): string[] {
  const section = /## Routes[\s\S]*?\n## /.exec(plan)?.[0] ?? "";
  const out: string[] = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith("| ")) continue;
    const cell = line.split("|")[2] ?? "";
    for (const m of cell.matchAll(/`(\/[^`]*)`/g)) out.push(m[1] ?? "");
  }
  return out;
}

describe("route table", () => {
  it("contains every route in the plan, and nothing else", () => {
    const fromPlan = planRoutes();
    expect(fromPlan.length).toBeGreaterThan(30);
    expect(ROUTES.map((r) => r.path).sort()).toEqual([...fromPlan].sort());
  });

  it("matches dynamic segments", () => {
    expect(matchRoute("/client/claims/CLM-26-000418/check")?.path).toBe("/client/claims/[claimNo]/check");
    expect(matchRoute("/client/cover/buy/abc")?.path).toBe("/client/cover/buy/[purchaseId]");
    expect(matchRoute("/client/cover/PR-JSD-RF-2026")?.path).toBe("/client/cover/[recordKey]");
    expect(matchRoute("/capture/tok123")?.access).toBe("capture");
    expect(matchRoute("/client/nope")).toBeNull();
    expect(matchRoute("/insurer/claims/")?.path).toBe("/insurer/claims");
  });

  it("maps each portal route to the portal of its prefix", () => {
    for (const r of ROUTES) {
      if (r.access === "client" || r.access === "insurer" || r.access === "admin") {
        expect(r.path.startsWith(`/${r.access}/`)).toBe(true);
      }
    }
  });
});

describe("nav items", () => {
  it("every item points at a route in the table and uses an icon from the sprite", () => {
    for (const items of [...Object.values(NAV), CLIENT_TABS]) {
      for (const item of items) {
        expect(matchRoute(item.href), item.href).not.toBeNull();
        expect(ICON_NAMES, item.icon).toContain(item.icon);
      }
    }
  });

  it("follows PLAN 4.5 order and labels", () => {
    expect(NAV.client.map((i) => i.key)).toEqual(["home", "farm", "risk", "cover", "claims", "wallet", "alerts"]);
    expect(NAV.insurer.map((i) => i.label)).toEqual(["Dashboard", "Products", "Underwriting", "Claims", "Portfolio", "Wallet & payouts"]);
    expect(NAV.admin.map((i) => i.label)).toEqual(["Overview", "Insurers", "Policy quality", "Disputes & SLAs", "Country packs", "Audit log"]);
    expect(CLIENT_TABS.map((i) => i.label)).toEqual(["Home", "Farm", "Cover", "Claims", "Wallet"]);
  });

  it("marks the current item through the data-nav match list", () => {
    const tab = (key: string) => CLIENT_TABS.find((t) => t.key === key)!;
    expect(isCurrent(tab("home"), pageKeyFor("/client/alerts/ALR-1"))).toBe(true);
    expect(isCurrent(tab("farm"), pageKeyFor("/client/risk"))).toBe(true);
    expect(isCurrent(tab("farm"), pageKeyFor("/client/farm/livestock"))).toBe(true);
    expect(isCurrent(tab("cover"), pageKeyFor("/client/cover/buy/p1"))).toBe(true);
    expect(isCurrent(tab("wallet"), pageKeyFor("/client/claims"))).toBe(false);
    const side = NAV.client.find((i) => i.key === "risk")!;
    expect(isCurrent(side, "risk")).toBe(true);
    expect(isCurrent(side, "farm")).toBe(false);
  });

  it("badges come from the API: items declare a key, not a number", () => {
    for (const item of Object.values(NAV).flat()) {
      if (item.badge) expect(item.badge).toMatch(/^[a-z]+$/);
    }
  });
});

describe("roles", () => {
  const roles: Role[] = ["client_owner", "product_manager", "underwriter_adjuster", "finance", "superadmin"];

  it("every role has a portal and a home", () => {
    for (const role of roles) {
      expect(ROLE_PORTAL[role]).toBeDefined();
      expect(homeForRole(role)).toBe(PORTAL_HOME[ROLE_PORTAL[role]]);
    }
    expect(portalForRole("hacker")).toBeNull();
  });
});

describe("guard", () => {
  const sandbox = { sandbox: true };

  it("lets public routes through without a session", () => {
    for (const p of ["/", "/sign-in", "/capture/tok", "/something-else"]) {
      expect(guard(p, null, sandbox)).toEqual({ action: "next" });
    }
  });

  it("sends a signed-out visitor to sign-in with the return path", () => {
    expect(guard("/insurer/claims", null, { sandbox: true, returnTo: "/insurer/claims?q=1" })).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Finsurer%2Fclaims%3Fq%3D1",
    });
    expect(guard("/admin/audit", { role: "nonsense" }, sandbox)).toMatchObject({ action: "redirect" });
  });

  const portalPath = { client: "/client/home", insurer: "/insurer/dashboard", admin: "/admin/overview" } as const;

  it("allows each role into its own portal and nowhere else", () => {
    for (const role of ["client_owner", "product_manager", "underwriter_adjuster", "finance", "superadmin"] as const) {
      const own = ROLE_PORTAL[role];
      for (const [portal, p] of Object.entries(portalPath)) {
        const res = guard(p, { role }, sandbox);
        if (portal === own) expect(res).toEqual({ action: "next" });
        else expect(res).toEqual({ action: "redirect", to: PORTAL_HOME[own], flash: "wrong_portal" });
      }
    }
  });

  it("guards deep routes by prefix", () => {
    expect(guard("/client/claims/CLM-26-000418/check", { role: "superadmin" }, sandbox)).toMatchObject({ action: "redirect" });
    expect(guard("/insurer/products/PR-JSD-RF-2026", { role: "client_owner" }, sandbox)).toMatchObject({ action: "redirect" });
    expect(guard("/clientele", null, sandbox)).toEqual({ action: "next" });
  });

  it("/dev exists only in the sandbox", () => {
    expect(guard("/dev/kitchen-sink", null, { sandbox: true })).toEqual({ action: "next" });
    expect(guard("/dev/inbox", null, { sandbox: false })).toEqual({ action: "not_found" });
    expect(guard("/dev", { role: "superadmin" }, { sandbox: false })).toEqual({ action: "not_found" });
  });

  it("names the flash cookie", () => {
    expect(FLASH_COOKIE).toBe("aigri_flash");
  });
});
