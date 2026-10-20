import { API_PREFIX, serverApiOrigin } from "./config";
import type { Me } from "./standin";

/**
 * Resolve the signed-in user from the request's cookies: GET /api/v1/auth/me with the Cookie header forwarded.
 * Returns null when there is no valid session, and also when the API cannot be reached (fail closed: a portal
 * route is then treated as signed out rather than served).
 * Works in middleware (edge-safe: only fetch) and in Server Components.
 */
export async function fetchMe(
  cookieHeader: string | null | undefined,
  origin: string = serverApiOrigin(),
  fetchImpl: typeof fetch = fetch,
): Promise<Me | null> {
  if (!cookieHeader) return null;
  try {
    const res = await fetchImpl(`${origin}${API_PREFIX}/auth/me`, {
      headers: { cookie: cookieHeader, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const me = (await res.json()) as Partial<Me> | null;
    return me && typeof me.role === "string" ? (me as Me) : null;
  } catch {
    return null;
  }
}
