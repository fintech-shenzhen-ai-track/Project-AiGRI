// Where the API lives, for server code (Server Components, middleware) and for the browser.

export const API_PREFIX = "/api/v1";

/**
 * Origin of the FastAPI app as seen from the Next.js server.
 * `API_INTERNAL_URL` wins (set it to http://api:8000 in Docker); otherwise the origin of
 * `NEXT_PUBLIC_API_BASE` (compose passes http://localhost:8000/api/v1); otherwise localhost:8000.
 */
export function serverApiOrigin(env: Record<string, string | undefined> = process.env): string {
  const internal = env.API_INTERNAL_URL;
  if (internal) return internal.replace(/\/+$/, "");
  const base = env.NEXT_PUBLIC_API_BASE;
  if (base) {
    try {
      return new URL(base).origin;
    } catch {
      // fall through to the default
    }
  }
  return "http://localhost:8000";
}

/**
 * Browsers call the same origin (`/api/v1/...`); middleware.ts proxies those requests to the API.
 * That keeps the httpOnly session cookie first-party and needs no CORS.
 */
export const BROWSER_API_ORIGIN = "";
