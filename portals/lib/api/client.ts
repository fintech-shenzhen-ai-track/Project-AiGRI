import { BROWSER_API_ORIGIN } from "./config";
import { errorFromResponse, networkError } from "./errors";
import type { paths } from "./types";

// A small typed fetch wrapper over the OpenAPI types (FR-03.5). No dependency beyond `fetch`.
//
//   const health = await api.get("/api/v1/health");                    // typed from openapi.json
//   const me = await api.request<Me>("GET", "/api/v1/auth/me");       // explicit type, for operations not yet exported
//
// Errors are thrown as ApiError (see errors.ts). Use `err.userMessage` for anything shown to a person.

type Method = "get" | "post" | "put" | "patch" | "delete";

type PathsWith<M extends Method> = {
  [P in keyof paths]: paths[P] extends { [K in M]: infer Op } ? ([Op] extends [never] ? never : P) : never;
}[keyof paths];

type Operation<P extends keyof paths, M extends Method> = paths[P] extends { [K in M]: infer Op } ? Op : never;

type JsonBody<C> = C extends { content: { "application/json": infer J } } ? J : void;
type SuccessStatus = 200 | 201 | 202;

export type ResponseOf<Op> = Op extends { responses: infer R } ? JsonBody<R[Extract<keyof R, SuccessStatus>]> : never;
export type BodyOf<Op> = Op extends { requestBody: infer B } ? JsonBody<NonNullable<B>> : never;
export type QueryOf<Op> = Op extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never;
export type PathParamsOf<Op> = Op extends { parameters: { path?: infer Pp } } ? NonNullable<Pp> : never;

export interface RequestInitLite {
  query?: Record<string, string | number | boolean | null | undefined>;
  params?: Record<string, string | number>;
  body?: unknown;
  /** Sent as `Idempotency-Key`. Required by every POST that creates money movement, a confirmation or a decision. */
  idempotencyKey?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

type TypedInit<Op> = Omit<RequestInitLite, "query" | "params" | "body"> &
  ([QueryOf<Op>] extends [never] ? { query?: undefined } : { query?: QueryOf<Op> }) &
  ([PathParamsOf<Op>] extends [never] ? { params?: undefined } : { params: PathParamsOf<Op> }) &
  ([BodyOf<Op>] extends [never] ? { body?: undefined } : { body: BodyOf<Op> });

export interface ApiClientOptions {
  /** "" for same-origin browser calls; an absolute origin on the server. */
  origin: string;
  /** Extra headers per request, for example the forwarded Cookie header in Server Components. */
  headers?: () => Promise<Record<string, string>> | Record<string, string>;
  fetch?: typeof fetch;
}

export function newIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

function buildUrl(origin: string, path: string, init: RequestInitLite): string {
  let p = path;
  for (const [k, v] of Object.entries(init.params ?? {})) {
    p = p.replace(`{${k}}`, encodeURIComponent(String(v)));
  }
  if (/\{[^}]+\}/.test(p)) throw new Error(`Missing path parameter for ${path}`);
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const q = qs.toString();
  return `${origin}${p}${q ? `?${q}` : ""}`;
}

export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));

  async function request<T>(method: string, path: string, init: RequestInitLite = {}): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json", ...(await options.headers?.()), ...init.headers };
    if (init.idempotencyKey) headers["idempotency-key"] = init.idempotencyKey;
    let body: string | undefined;
    if (init.body !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(init.body);
    }
    const url = buildUrl(options.origin, path, init);
    let res: Response;
    try {
      res = await doFetch(url, {
        method: method.toUpperCase(),
        headers,
        body,
        signal: init.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw networkError(cause);
    }
    if (!res.ok) throw await errorFromResponse(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  function typed<M extends Method>(method: M) {
    return <P extends PathsWith<M>>(path: P, init?: TypedInit<Operation<P, M>>): Promise<ResponseOf<Operation<P, M>>> =>
      request<ResponseOf<Operation<P, M>>>(method, path, (init ?? {}) as RequestInitLite);
  }

  return {
    request,
    get: typed("get"),
    post: typed("post"),
    put: typed("put"),
    patch: typed("patch"),
    delete: typed("delete"),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Browser client: same-origin `/api/v1/...`, proxied to the API by middleware.ts. */
export const browserApi: ApiClient = createApiClient({ origin: BROWSER_API_ORIGIN });
