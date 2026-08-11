import { createHmac, timingSafeEqual } from "node:crypto";

export function signPublishUrl(
  postId: string,
  filename: string,
  expiresAt: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${postId}:${filename}:${expiresAt}`)
    .digest("base64url");
}

export function verifyPublishSig(
  sig: string,
  postId: string,
  filename: string,
  expiresAt: number,
  secret: string,
): boolean {
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = signPublishUrl(postId, filename, expiresAt, secret);
  const actual = Buffer.from(sig);
  const reference = Buffer.from(expected);

  if (actual.length !== reference.length) {
    return false;
  }

  return timingSafeEqual(actual, reference);
}

export function buildPublishImageUrl(
  postId: string,
  filename: string,
  baseUrl: string,
  secret: string,
  ttlMs = 3_600_000,
): string {
  const expiresAt = Date.now() + ttlMs;
  const sig = signPublishUrl(postId, filename, expiresAt, secret);
  const base = baseUrl.replace(/\/$/, "");

  return `${base}/publish/media/${encodeURIComponent(sig)}/${encodeURIComponent(postId)}/${encodeURIComponent(filename)}?exp=${expiresAt}`;
}

export function filenameFromStoragePath(storagePath: string): string {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] ?? storagePath;
}
