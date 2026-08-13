import type { ServerResponse } from "node:http";
import type { AppContext } from "../../api/app-context.ts";
import { sendCodedError } from "../../api/json.ts";
import { ErrorCodes } from "../errors/error-codes.ts";

export type MetaReadinessReason = "no_token" | "no_ig_user" | "token_expired";

export type MetaReadinessResult = {
  ready: boolean;
  reason?: MetaReadinessReason;
};

export function evaluateMetaReadiness(input: {
  token: string | null;
  igUserId: string | null;
  tokenExpired: boolean;
}): MetaReadinessResult {
  if (!input.token) {
    return { ready: false, reason: "no_token" };
  }

  if (input.tokenExpired) {
    return { ready: false, reason: "token_expired" };
  }

  if (!input.igUserId) {
    return { ready: false, reason: "no_ig_user" };
  }

  return { ready: true };
}

export function getMetaReadiness(ctx: AppContext): MetaReadinessResult {
  const token = ctx.metaTokenStore.getActiveToken();
  const connection = ctx.metaConnectionStore.get();
  const tokenRow = ctx.db
    .prepare("SELECT expires_at FROM meta_tokens ORDER BY updated_at DESC LIMIT 1")
    .get() as { expires_at: string | null } | undefined;

  const tokenExpiresAt = tokenRow?.expires_at ?? null;
  const tokenExpired =
    tokenExpiresAt !== null && Date.parse(tokenExpiresAt) < Date.now();

  return evaluateMetaReadiness({
    token,
    igUserId: connection?.igUserId ?? null,
    tokenExpired,
  });
}

export function metaReadinessErrorCode(reason: MetaReadinessReason): string {
  switch (reason) {
    case "no_token":
      return ErrorCodes.META_NOT_CONNECTED;
    case "no_ig_user":
      return ErrorCodes.META_NO_IG_USER;
    case "token_expired":
      return ErrorCodes.META_TOKEN_EXPIRED;
  }
}

/** @deprecated Use coded API errors; kept for internal logging and legacy callers. */
export function metaReadinessMessage(result: MetaReadinessResult): string {
  switch (result.reason) {
    case "no_token":
      return "Instagram não conectado. Conecte em configurações.";
    case "no_ig_user":
      return "Conta Instagram não vinculada. Reconecte em configurações.";
    case "token_expired":
      return "Token do Instagram expirou. Reconecte em configurações.";
    default:
      return "Instagram não está pronto para sincronizar comentários.";
  }
}

export class MetaNotConnectedError extends Error {
  readonly code: string;
  readonly details: { reason: MetaReadinessReason };

  constructor(readiness: MetaReadinessResult) {
    const reason = readiness.reason ?? "no_token";
    super(reason);
    this.name = "MetaNotConnectedError";
    this.code = metaReadinessErrorCode(reason);
    this.details = { reason };
  }
}

export function sendMetaReadinessError(
  res: ServerResponse,
  readiness: MetaReadinessResult,
  status = 503,
): void {
  const reason = readiness.reason ?? "no_token";
  sendCodedError(res, status, metaReadinessErrorCode(reason), { reason });
}

export function assertMetaReadyForSchedule(ctx: AppContext): void {
  const result = getMetaReadiness(ctx);
  if (!result.ready) {
    throw new MetaNotConnectedError(result);
  }
}
