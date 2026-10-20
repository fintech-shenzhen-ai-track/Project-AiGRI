// API errors and their user-safe messages (FR-03.5). Wire format: specs/00-shared/api-conventions.md
// `{ "error": { "code", "message", "details" } }`. Voice: DESIGN.md 13 (what happened, what is safe, what to do next).

export interface ApiErrorBody {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  /** Value of the response's `x-request-id` header, when the API sent one (useful in support requests). */
  readonly requestId: string | null;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}, requestId: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  /** The sentence to show a person. Never contains a stack trace, a SQL error or an internal id. */
  get userMessage(): string {
    return userMessage(this);
  }
}

/** Codes the UI words itself (stable snake_case codes from the API). */
export const CODE_MESSAGES: Readonly<Record<string, string>> = {
  not_signed_in: "You are not signed in. Nothing was changed. Sign in and try again.",
  forbidden: "You do not have access to this. Nothing was changed.",
  not_found: "We could not find that. Check the link and try again.",
  validation_error: "That request was not valid. Nothing was changed. Check the details and try again.",
  conflict: "That no longer matches the current state. Nothing was changed. Refresh and try again.",
  unprocessable: "Something in that request could not be accepted. Nothing was changed.",
  rate_limited: "Too many requests. Nothing was changed. Wait a little and try again.",
  consent_hash_mismatch: "What you confirmed has changed since you confirmed it. Nothing was sent. Review the latest version and confirm again.",
  network_error: "We could not reach AiGRI. Nothing was changed. Check your connection and try again.",
  server_error: "Something went wrong on our side. Nothing was changed. Try again in a moment.",
};

const STATUS_CODE: Readonly<Record<number, string>> = {
  400: "validation_error",
  401: "not_signed_in",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "unprocessable",
  429: "rate_limited",
};

/**
 * Message for a person. Order: 5xx is always the generic server message (never echo server text); then our own
 * wording for the code; then the API's `message` (already plain language by the conventions); then the status.
 */
export function userMessage(err: Pick<ApiError, "status" | "code" | "message">): string {
  if (err.status >= 500) return CODE_MESSAGES.server_error as string;
  const byCode = CODE_MESSAGES[err.code];
  if (byCode) return byCode;
  if (err.message.trim()) return err.message;
  return CODE_MESSAGES[STATUS_CODE[err.status] ?? "server_error"] as string;
}

export function networkError(cause?: unknown): ApiError {
  const e = new ApiError(0, "network_error", CODE_MESSAGES.network_error as string);
  if (cause !== undefined) e.cause = cause;
  return e;
}

/** Build an ApiError from a non-2xx response. Tolerates bodies that are not the standard error shape. */
export async function errorFromResponse(res: Response): Promise<ApiError> {
  const requestId = res.headers.get("x-request-id");
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // not JSON (a proxy error page, for example)
  }
  const raw = (body as { error?: Partial<ApiErrorBody> } | null)?.error;
  const code = typeof raw?.code === "string" ? raw.code : (STATUS_CODE[res.status] ?? (res.status >= 500 ? "server_error" : "error"));
  const message = typeof raw?.message === "string" ? raw.message : "";
  const details = raw?.details && typeof raw.details === "object" ? raw.details : {};
  return new ApiError(res.status, code, message, details, requestId);
}
