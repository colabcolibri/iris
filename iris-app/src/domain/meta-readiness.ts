import type { AppContext } from "../api/app-context.ts";

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

export class MetaNotConnectedError extends Error {
  readonly code = "meta_not_connected";

  constructor(message = "Conecte Instagram antes de agendar publicações.") {
    super(message);
    this.name = "MetaNotConnectedError";
  }
}

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

export function assertMetaReadyForSchedule(ctx: AppContext): void {
  const result = getMetaReadiness(ctx);
  if (!result.ready) {
    throw new MetaNotConnectedError(metaReadinessMessage(result));
  }
}
