import { cache } from "react";
import { createApiClient } from "@/lib/api/client";
import { serverApiOrigin } from "@/lib/api/config";
import type { Pack } from "./types";

// Server Components: read a country pack from GET /api/v1/packs/{code}. Packs are public reference data, so no
// session cookie is forwarded. Cached for the duration of the request.
export const loadPack = cache(async (code: string): Promise<Pack> => {
  const api = createApiClient({ origin: serverApiOrigin() });
  return api.request<Pack>("GET", "/api/v1/packs/{code}", { params: { code } });
});
