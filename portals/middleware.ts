import { NextResponse, type NextRequest } from "next/server";
import { API_PREFIX, serverApiOrigin } from "@/lib/api/config";
import { fetchMe } from "@/lib/api/session";
import { FLASH_COOKIE, guard } from "@/lib/guard";

// Two jobs (T-03.03, FR-03.7):
//  1. Proxy /api/v1/* to the FastAPI app at request time, so the browser stays on one origin.
//  2. Enforce the prefix <-> role mapping for /client, /insurer, /admin (and /dev in the sandbox only),
//     using GET /api/v1/auth/me. One lookup per request: this function is the only caller on the request path.

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`)) {
    return NextResponse.rewrite(new URL(`${pathname}${search}`, serverApiOrigin()));
  }

  const sandbox = process.env.SANDBOX === "true";
  const needsSession = /^\/(client|insurer|admin)(\/|$)/.test(pathname);
  const me = needsSession ? await fetchMe(req.headers.get("cookie")) : null;
  const result = guard(pathname, me, { sandbox, returnTo: `${pathname}${search}` });

  switch (result.action) {
    case "next":
      return NextResponse.next();
    case "not_found":
      // /dev is sandbox only: outside the sandbox it does not exist. Rewrite to a path no page owns.
      return NextResponse.rewrite(new URL("/__not-found__", req.url), { status: 404 });
    case "redirect": {
      const res = NextResponse.redirect(new URL(result.to, req.url));
      if (result.flash) {
        res.cookies.set(FLASH_COOKIE, result.flash, { path: "/", maxAge: 30, sameSite: "lax" });
      }
      return res;
    }
  }
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    // Pages: everything except the API, Next internals and static files (anything with a file extension).
    "/((?!api/|_next/|health$|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
