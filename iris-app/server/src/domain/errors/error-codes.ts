/** Stable API error codes — translated on the client via `server-errors` domain. */
export const ErrorCodes = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  META_NOT_CONNECTED: "META_NOT_CONNECTED",
  META_TOKEN_EXPIRED: "META_TOKEN_EXPIRED",
  META_NO_IG_USER: "META_NO_IG_USER",
  PUBLISH_NOT_CONFIGURED: "PUBLISH_NOT_CONFIGURED",
  RATE_LIMITED: "RATE_LIMITED",
  MESSAGING_WINDOW_EXPIRED: "MESSAGING_WINDOW_EXPIRED",
  META_SEND_FAILED: "META_SEND_FAILED",
  CONTACT_INVALID: "CONTACT_INVALID",
  BODY_TOO_LARGE: "BODY_TOO_LARGE",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const ERROR_CODE_SET = new Set<string>(Object.values(ErrorCodes));

export function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODE_SET.has(value);
}
