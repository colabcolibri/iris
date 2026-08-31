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
): string {
  const version = oauthStateVersion(flow);
  const expiresMs = Date.now() + OAUTH_STATE_TTL_MS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${version}.${expiresMs}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}.${nonce}`;
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
  if (parts.length !== 4 || parts[0] !== expectedVersion) {
    return false;
  }

  const expiresMs = Number(parts[1]);
  if (!Number.isFinite(expiresMs) || Date.now() > expiresMs) {
    return false;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (!timingSafeStringEqual(parts[2]!, expectedSignature)) {
    return false;
  }

  return Boolean(parts[3]);
}
