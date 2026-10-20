import type { IconName } from "@/components/icons/paths";

// Navigation config (FR-03.6). Every route of specs/03-ui-shell/plan.md "Routes", the nav items of
// system-preview/PLAN.md 4.5, and the role -> portal mapping used by middleware.ts (FR-03.7).
// Features never edit this file (ownership.md, "Navigation config").

export type Portal = "client" | "insurer" | "admin";

/** Membership roles from specs/00-shared/data-model.md (`memberships.role`). */
export type Role = "client_owner" | "product_manager" | "underwriter_adjuster" | "finance" | "superadmin";

export const ROLE_PORTAL: Record<Role, Portal> = {
  client_owner: "client",
  product_manager: "insurer",
  underwriter_adjuster: "insurer",
  finance: "insurer",
  superadmin: "admin",
};

export const PORTAL_HOME: Record<Portal, string> = {
  client: "/client/home",
  insurer: "/insurer/dashboard",
  admin: "/admin/overview",
};

export const PORTAL_LABEL: Record<Portal, string> = {
  client: "Client",
  insurer: "Insurer",
  admin: "Superadmin",
};

export function portalForRole(role: string): Portal | null {
  return (ROLE_PORTAL as Record<string, Portal | undefined>)[role] ?? null;
}

export function homeForRole(role: string): string | null {
  const portal = portalForRole(role);
  return portal ? PORTAL_HOME[portal] : null;
}

// ---------------------------------------------------------------------------------------------
// Routes

/** Who may load a route. `public` needs no session; `capture` is token-based; `dev` is sandbox only. */
export type RouteAccess = Portal | "public" | "capture" | "dev";

export interface RouteDef {
  /** Next.js style pattern, e.g. `/client/cover/[recordKey]`. */
  path: string;
  access: RouteAccess;
  /** Feature that owns the page (specs/00-shared/ownership.md). */
  feature: number;
  /** Value of `data-page` on <body>; nav items match it through their `match` list. */
  page: string;
}

export const ROUTES: readonly RouteDef[] = [
  { path: "/", access: "public", feature: 17, page: "landing" },
  { path: "/sign-in", access: "public", feature: 3, page: "signin" },
  { path: "/capture/[token]", access: "capture", feature: 6, page: "capture" },

  { path: "/client/onboarding", access: "client", feature: 6, page: "onboarding" },
  { path: "/client/home", access: "client", feature: 9, page: "home" },
  { path: "/client/farm", access: "client", feature: 6, page: "farm" },
  { path: "/client/farm/livestock", access: "client", feature: 6, page: "farm" },
  { path: "/client/risk", access: "client", feature: 7, page: "risk" },
  { path: "/client/cover", access: "client", feature: 7, page: "cover" },
  { path: "/client/cover/[recordKey]", access: "client", feature: 7, page: "cover" },
  { path: "/client/cover/buy/[purchaseId]", access: "client", feature: 8, page: "cover" },
  { path: "/client/alerts", access: "client", feature: 9, page: "alerts" },
  { path: "/client/alerts/[alertId]", access: "client", feature: 9, page: "alerts" },
  { path: "/client/claims", access: "client", feature: 11, page: "claims" },
  { path: "/client/claims/[claimNo]", access: "client", feature: 11, page: "claims" },
  { path: "/client/claims/[claimNo]/check", access: "client", feature: 11, page: "claims" },
  { path: "/client/wallet", access: "client", feature: 12, page: "wallet" },
  { path: "/client/settings", access: "client", feature: 3, page: "settings" },

  { path: "/insurer/dashboard", access: "insurer", feature: 13, page: "dashboard" },
  { path: "/insurer/products", access: "insurer", feature: 4, page: "products" },
  { path: "/insurer/products/[recordId]", access: "insurer", feature: 4, page: "products" },
  { path: "/insurer/underwriting", access: "insurer", feature: 8, page: "underwriting" },
  { path: "/insurer/claims", access: "insurer", feature: 11, page: "claims" },
  { path: "/insurer/claims/[claimNo]", access: "insurer", feature: 11, page: "claims" },
  { path: "/insurer/portfolio", access: "insurer", feature: 13, page: "portfolio" },
  { path: "/insurer/wallet", access: "insurer", feature: 12, page: "wallet" },

  { path: "/admin/overview", access: "admin", feature: 14, page: "overview" },
  { path: "/admin/insurers", access: "admin", feature: 14, page: "insurers" },
  { path: "/admin/quality", access: "admin", feature: 14, page: "quality" },
  { path: "/admin/disputes", access: "admin", feature: 14, page: "disputes" },
  { path: "/admin/packs", access: "admin", feature: 14, page: "packs" },
  { path: "/admin/audit", access: "admin", feature: 14, page: "audit" },

  { path: "/dev/kitchen-sink", access: "dev", feature: 3, page: "dev" },
  { path: "/dev/inbox", access: "dev", feature: 1, page: "dev" },
  { path: "/dev/clock", access: "dev", feature: 3, page: "dev" },
];

function patternToRegExp(pattern: string): RegExp {
  const source = pattern
    .split("/")
    .map((seg) => (/^\[[^\]]+\]$/.test(seg) ? "[^/]+" : seg.replace(/[.*+?^${}()|\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${source}/?$`);
}

const COMPILED = ROUTES.map((route) => ({ route, re: patternToRegExp(route.path) }));

/** The route definition that matches a pathname, or null. */
export function matchRoute(pathname: string): RouteDef | null {
  return COMPILED.find((c) => c.re.test(pathname))?.route ?? null;
}

/** The portal a pathname belongs to, by its first segment ("/insurer/..." -> "insurer"), or null. */
export function portalOfPath(pathname: string): Portal | null {
  const first = pathname.split("/")[1];
  return first === "client" || first === "insurer" || first === "admin" ? first : null;
}

/** `data-page` for a pathname. Falls back to the first segment below the portal prefix. */
export function pageKeyFor(pathname: string): string {
  const hit = matchRoute(pathname);
  if (hit) return hit.page;
  return pathname.split("/")[2] ?? "";
}

// ---------------------------------------------------------------------------------------------
// Navigation items (PLAN 4.5)

export type BadgeTone = "default" | "need";

export interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  /** Space-separated list of `data-page` values that mark this item current (PLAN 4.5, warning 9). */
  match: string;
  /** Key in the badges response of `/api/v1/<portal>/badges`; the item has no badge without it. */
  badge?: string;
  badgeTone?: BadgeTone;
}

export const NAV: Record<Portal, readonly NavItem[]> = {
  client: [
    { key: "home", label: "Home", icon: "home", href: "/client/home", match: "home" },
    { key: "farm", label: "My farm", icon: "farm", href: "/client/farm", match: "farm" },
    { key: "risk", label: "Risk", icon: "chart", href: "/client/risk", match: "risk" },
    { key: "cover", label: "Cover", icon: "shield", href: "/client/cover", match: "cover" },
    { key: "claims", label: "Claims", icon: "file-check", href: "/client/claims", match: "claims" },
    { key: "wallet", label: "Wallet", icon: "wallet", href: "/client/wallet", match: "wallet" },
    { key: "alerts", label: "Alerts", icon: "bell", href: "/client/alerts", match: "alerts", badge: "alerts", badgeTone: "need" },
  ],
  insurer: [
    { key: "dashboard", label: "Dashboard", icon: "home", href: "/insurer/dashboard", match: "dashboard" },
    { key: "products", label: "Products", icon: "file", href: "/insurer/products", match: "products" },
    { key: "underwriting", label: "Underwriting", icon: "shield-check", href: "/insurer/underwriting", match: "underwriting", badge: "underwriting" },
    { key: "claims", label: "Claims", icon: "file-check", href: "/insurer/claims", match: "claims", badge: "claims" },
    { key: "portfolio", label: "Portfolio", icon: "layers", href: "/insurer/portfolio", match: "portfolio" },
    { key: "wallet", label: "Wallet & payouts", icon: "wallet", href: "/insurer/wallet", match: "wallet" },
  ],
  admin: [
    { key: "overview", label: "Overview", icon: "activity", href: "/admin/overview", match: "overview" },
    { key: "insurers", label: "Insurers", icon: "building", href: "/admin/insurers", match: "insurers", badge: "insurers", badgeTone: "need" },
    { key: "quality", label: "Policy quality", icon: "file-check", href: "/admin/quality", match: "quality", badge: "quality" },
    { key: "disputes", label: "Disputes & SLAs", icon: "scale", href: "/admin/disputes", match: "disputes", badge: "disputes" },
    { key: "packs", label: "Country packs", icon: "globe", href: "/admin/packs", match: "packs" },
    { key: "audit", label: "Audit log", icon: "list", href: "/admin/audit", match: "audit" },
  ],
};

/** Client mobile tab bar (5 tabs). Home also covers Alerts; Farm also covers Risk (PLAN 4.5). */
export const CLIENT_TABS: readonly NavItem[] = [
  { key: "home", label: "Home", icon: "home", href: "/client/home", match: "home alerts" },
  { key: "farm", label: "Farm", icon: "farm", href: "/client/farm", match: "farm risk" },
  { key: "cover", label: "Cover", icon: "shield", href: "/client/cover", match: "cover" },
  { key: "claims", label: "Claims", icon: "file-check", href: "/client/claims", match: "claims" },
  { key: "wallet", label: "Wallet", icon: "wallet", href: "/client/wallet", match: "wallet" },
];

/** Mobile bar bell (client, PLAN 4.5). */
export const CLIENT_ALERTS_HREF = "/client/alerts";

/** True when `item` is the current item for a `data-page` value. */
export function isCurrent(item: Pick<NavItem, "match">, page: string): boolean {
  return item.match.split(/\s+/).includes(page);
}

/** Endpoint that returns the badge counts for a portal's nav (FR-03.6). */
export function badgesPath(portal: Portal): string {
  return `/api/v1/${portal}/badges`;
}
