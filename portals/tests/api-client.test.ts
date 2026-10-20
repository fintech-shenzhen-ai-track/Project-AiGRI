import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/client";
import { serverApiOrigin } from "@/lib/api/config";
import { ApiError, CODE_MESSAGES, errorFromResponse, userMessage } from "@/lib/api/errors";
import { fetchMe } from "@/lib/api/session";

type Call = { url: string; init: RequestInit };

function fakeFetch(respond: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return respond(call);
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

describe("api client", () => {
  it("calls a typed operation from openapi.json and returns its JSON", async () => {
    const f = fakeFetch(() => json({ status: "ok", components: { db: { status: "ok" } } }));
    const api = createApiClient({ origin: "http://api:8000", fetch: f.fn });
    const health = await api.get("/api/v1/health");
    // `health` is typed as HealthResponse: this line fails to compile if the typing is lost.
    const status: "ok" | "degraded" = health.status;
    expect(status).toBe("ok");
    expect(f.calls[0]?.url).toBe("http://api:8000/api/v1/health");
    expect(f.calls[0]?.init.method).toBe("GET");
  });

  it("builds query strings and path params, and encodes them", async () => {
    const f = fakeFetch(() => json({}));
    const api = createApiClient({ origin: "", fetch: f.fn });
    await api.request("GET", "/api/v1/client/claims/{claimNo}", {
      params: { claimNo: "CLM-26-000418" },
      query: { limit: 50, cursor: undefined, open: true, q: "a b" },
    });
    expect(f.calls[0]?.url).toBe("/api/v1/client/claims/CLM-26-000418?limit=50&open=true&q=a+b");
    await expect(api.request("GET", "/api/v1/x/{id}")).rejects.toThrow(/Missing path parameter/);
  });

  it("sends JSON bodies and the Idempotency-Key header", async () => {
    const f = fakeFetch(() => json({ ok: true }, 201));
    const api = createApiClient({ origin: "", fetch: f.fn });
    await api.request("POST", "/api/v1/client/purchases", { body: { a: 1 }, idempotencyKey: "k-1" });
    const headers = f.calls[0]?.init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["idempotency-key"]).toBe("k-1");
    expect(f.calls[0]?.init.body).toBe('{"a":1}');
  });

  it("forwards extra headers such as the session cookie", async () => {
    const f = fakeFetch(() => json({}));
    const api = createApiClient({ origin: "http://api:8000", fetch: f.fn, headers: async () => ({ cookie: "sid=abc" }) });
    await api.request("GET", "/api/v1/auth/me");
    expect((f.calls[0]?.init.headers as Record<string, string>).cookie).toBe("sid=abc");
  });

  it("returns undefined for 204", async () => {
    const f = fakeFetch(() => new Response(null, { status: 204 }));
    const api = createApiClient({ origin: "", fetch: f.fn });
    await expect(api.request("POST", "/api/v1/auth/sign-out")).resolves.toBeUndefined();
  });

  it("throws ApiError with code, status, details and request id from the standard body", async () => {
    const f = fakeFetch(() =>
      json({ error: { code: "consent_hash_mismatch", message: "server words", details: { field: "x" } } }, 409, { "x-request-id": "req-9" }),
    );
    const api = createApiClient({ origin: "", fetch: f.fn });
    const err = await api.request("POST", "/api/v1/x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect([e.status, e.code, e.requestId, e.details]).toEqual([409, "consent_hash_mismatch", "req-9", { field: "x" }]);
    expect(e.userMessage).toBe(CODE_MESSAGES.consent_hash_mismatch);
  });

  it("maps a network failure to network_error", async () => {
    const f = fakeFetch(() => {
      throw new TypeError("fetch failed");
    });
    const api = createApiClient({ origin: "", fetch: f.fn });
    const e = (await api.request("GET", "/x").catch((x: unknown) => x)) as ApiError;
    expect(e.code).toBe("network_error");
    expect(e.userMessage).toBe(CODE_MESSAGES.network_error);
  });
});

describe("user-safe messages", () => {
  it("never echoes server text for 5xx", async () => {
    const res = json({ error: { code: "db_exploded", message: "psycopg2.OperationalError: password=hunter2", details: {} } }, 500);
    const e = await errorFromResponse(res);
    expect(e.userMessage).toBe(CODE_MESSAGES.server_error);
    expect(e.userMessage).not.toContain("psycopg2");
  });

  it("falls back from our wording, to the API message, to the status", async () => {
    expect(userMessage({ status: 403, code: "forbidden", message: "x" })).toBe(CODE_MESSAGES.forbidden);
    expect(userMessage({ status: 409, code: "claim_locked", message: "This claim is locked while the Adjuster reviews it." })).toBe(
      "This claim is locked while the Adjuster reviews it.",
    );
    expect(userMessage({ status: 429, code: "weird", message: "" })).toBe(CODE_MESSAGES.rate_limited);
  });

  it("tolerates a non-JSON error body (a proxy page)", async () => {
    const e = await errorFromResponse(new Response("<html>bad gateway</html>", { status: 502 }));
    expect(e.status).toBe(502);
    expect(e.code).toBe("server_error");
    expect(e.userMessage).toBe(CODE_MESSAGES.server_error);
  });

  it("every message says what is safe or what to do, with no exclamation marks and no 'Oops'", () => {
    for (const msg of Object.values(CODE_MESSAGES)) {
      expect(msg).not.toMatch(/!|oops/i);
    }
  });
});

describe("session lookup and origins", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("fetchMe forwards the cookie and returns the actor", async () => {
    const f = fakeFetch(() => json({ role: "client_owner", pack_code: "ID" }));
    const me = await fetchMe("sid=abc", "http://api:8000", f.fn);
    expect(me?.role).toBe("client_owner");
    expect(f.calls[0]?.url).toBe("http://api:8000/api/v1/auth/me");
    expect((f.calls[0]?.init.headers as Record<string, string>).cookie).toBe("sid=abc");
  });

  it("fetchMe is null with no cookie, on 401, on junk and when the API is down (fail closed)", async () => {
    const never = fakeFetch(() => json({}));
    expect(await fetchMe(null, "http://x", never.fn)).toBeNull();
    expect(never.calls).toHaveLength(0);
    expect(await fetchMe("sid=1", "http://x", fakeFetch(() => json({ error: {} }, 401)).fn)).toBeNull();
    expect(await fetchMe("sid=1", "http://x", fakeFetch(() => json({ nope: 1 })).fn)).toBeNull();
    expect(
      await fetchMe("sid=1", "http://x", fakeFetch(() => {
        throw new Error("down");
      }).fn),
    ).toBeNull();
  });

  it("serverApiOrigin prefers API_INTERNAL_URL, then NEXT_PUBLIC_API_BASE's origin", () => {
    expect(serverApiOrigin({ API_INTERNAL_URL: "http://api:8000/" })).toBe("http://api:8000");
    expect(serverApiOrigin({ NEXT_PUBLIC_API_BASE: "http://localhost:8000/api/v1" })).toBe("http://localhost:8000");
    expect(serverApiOrigin({})).toBe("http://localhost:8000");
  });
});
