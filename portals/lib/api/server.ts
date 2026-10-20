import { cache } from "react";
import { cookies } from "next/headers";
import { createApiClient, type ApiClient } from "./client";
import { serverApiOrigin } from "./config";
import { fetchMe } from "./session";
import type { Me } from "./standin";

// Server Components and route handlers only (imports next/headers). Forwards the visitor's session cookie.

/** A client that sends the current request's cookies to the API. Create one per request. */
export function serverApi(): ApiClient {
  return createApiClient({
    origin: serverApiOrigin(),
    headers: async (): Promise<Record<string, string>> => {
      const cookie = (await cookies()).toString();
      return cookie ? { cookie } : {};
    },
  });
}

/** The signed-in user for this request, or null. Cached for the duration of the request (React `cache`). */
export const getMe = cache(async (): Promise<Me | null> => fetchMe((await cookies()).toString()));
