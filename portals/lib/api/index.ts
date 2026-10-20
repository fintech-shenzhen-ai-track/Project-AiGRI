// Client-safe entry point: types, errors and the browser client. Server Components import "@/lib/api/server".
export { browserApi, createApiClient, newIdempotencyKey } from "./client";
export type { ApiClient, ApiClientOptions, RequestInitLite } from "./client";
export { ApiError, CODE_MESSAGES, userMessage } from "./errors";
export type { components, paths } from "./types";
export type { Badges, Me } from "./standin";
