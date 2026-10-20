// STAND-IN TYPES. Replace when contract C03 (auth endpoints, T-01.15 and T-01.17) and C02 merge.
//
// backend/openapi.json only holds GET /api/v1/health today, so the generated `types.ts` has no auth, clock or
// badges operations yet. These hand-written shapes follow specs/01-foundation/plan.md ("Auth endpoints",
// "Clock endpoints") and specs/00-shared/api-conventions.md. When the OpenAPI export has the operations:
//   1. run `make openapi`,
//   2. change each alias below to the generated schema (`components["schemas"][...]`),
//   3. delete this file.
// Nothing outside lib/api and middleware.ts should import from here directly; import from "@/lib/api".

import type { Role } from "@/lib/nav";

/** GET /api/v1/auth/me -> `{user, membership, role, client?, insurer?, pack_code}` (plan: Auth endpoints). */
export interface Me {
  user: { id: string; display_name: string };
  membership: { id: string; role: Role };
  role: Role;
  client?: { id: string; name: string };
  insurer?: { id: string; code: string; name: string };
  pack_code: string;
}

/** GET /api/v1/<portal>/badges: counts by nav badge key (FR-03.6). */
export type Badges = Record<string, number>;
