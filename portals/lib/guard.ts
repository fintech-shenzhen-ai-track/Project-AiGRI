import { PORTAL_HOME, portalForRole, portalOfPath } from "@/lib/nav";

// Role guard for the portal prefixes (FR-03.7). Pure, so it can be tested without a server;
// middleware.ts feeds it the result of GET /api/v1/auth/me.

/** Name of the short-lived cookie that carries a notice across the redirect (shown as a toast by the shell). */
export const FLASH_COOKIE = "aigri_flash";
export type FlashCode = "wrong_portal";

export type GuardResult =
  | { action: "next" }
  | { action: "redirect"; to: string; flash?: FlashCode }
  | { action: "not_found" };

export interface GuardActor {
  role: string;
}

/**
 * - `/client`, `/insurer`, `/admin`: need a session. No session -> sign in, then back to where you were.
 *   A session whose role belongs to another portal -> that user's own home, with a notice.
 * - `/dev`: sandbox only (FR-03.12); otherwise it does not exist.
 * - everything else (landing, sign-in, capture, assets): public. The capture page is authorised by its token.
 */
export function guard(
  pathname: string,
  actor: GuardActor | null,
  opts: { sandbox: boolean; /** Path plus query to return to after sign-in. Defaults to `pathname`. */ returnTo?: string },
): GuardResult {
  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return opts.sandbox ? { action: "next" } : { action: "not_found" };
  }

  const portal = portalOfPath(pathname);
  if (!portal) return { action: "next" };

  const own = actor ? portalForRole(actor.role) : null;
  if (!own) {
    return { action: "redirect", to: `/sign-in?next=${encodeURIComponent(opts.returnTo ?? pathname)}` };
  }
  if (own !== portal) {
    return { action: "redirect", to: PORTAL_HOME[own], flash: "wrong_portal" };
  }
  return { action: "next" };
}
