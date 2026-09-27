import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type MetaOAuthFlow = "instagram" | "page";

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function oauthStateVersion(flow: MetaOAuthFlow): string {
  return flow === "page" ? "oauth1-page" : "oauth1-ig";
}

export function createMetaOAuthState(
  secret: string,
  flow: MetaOAuthFlow = "instagram",
  accountId?: string,
): string {
  const version = oauthStateVersion(flow);
  const expiresMs = Date.now() + OAUTH_STATE_TTL_MS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = accountId
    ? `${version}.${expiresMs}.${accountId}`
    : `${version}.${expiresMs}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}.${nonce}`;
}

export function readMetaOAuthAccountId(
  state: string,
  secret: string,
  flow: MetaOAuthFlow = "instagram",
): string | null {
  if (!verifyMetaOAuthState(state, secret, flow)) {
    return null;
  }
  const parts = state.trim().split(".");
  if (parts.length !== 5) {
    return null;
  }
  return parts[2] ?? null;
}

export function verifyMetaOAuthState(
  state: string,
  secret: string,
  flow: MetaOAuthFlow = "instagram",
): boolean {
  if (!state.trim() || !secret.trim()) {
    return false;
  }

  const parts = state.trim().split(".");
  const expectedVersion = oauthStateVersion(flow);
  const withAccount = parts.length === 5;
  if ((parts.length !== 4 && !withAccount) || parts[0] !== expectedVersion) {
    return false;
  }

  const expiresMs = Number(parts[1]);
  if (!Number.isFinite(expiresMs) || Date.now() > expiresMs) {
    return false;
  }

  const payload = withAccount
    ? `${parts[0]}.${parts[1]}.${parts[2]}`
    : `${parts[0]}.${parts[1]}`;
  const signature = withAccount ? parts[3] : parts[2];
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (!signature || !timingSafeStringEqual(signature, expectedSignature)) {
    return false;
  }

  return Boolean(withAccount ? parts[4] : parts[3]);
}
