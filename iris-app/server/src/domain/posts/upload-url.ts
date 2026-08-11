import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getImageLimits } from "./image-limits.ts";

const UPLOAD_TTL_MS = 5 * 60 * 1000;
const redeemedJtis = new Map<string, number>();

export type PrepareAssetUploadInput = {
  postId: string;
  filename: string;
  sortOrder: number;
  baseUrl: string;
  secret: string;
  ttlMs?: number;
};

export type PreparedAssetUpload = {
  uploadUrl: string;
  expiresAt: number;
  maxBytes: number;
  sortOrder: number;
  filename: string;
  curlCommand: string;
};

function pruneRedeemed(now = Date.now()): void {
  for (const [jti, expiresAt] of redeemedJtis) {
    if (expiresAt <= now) {
      redeemedJtis.delete(jti);
    }
  }
}

export function signUploadUrl(
  postId: string,
  sortOrder: number,
  filename: string,
  jti: string,
  expiresAt: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`upload:${postId}:${sortOrder}:${filename}:${jti}:${expiresAt}`)
    .digest("base64url");
}

export function verifyUploadSig(
  sig: string,
  postId: string,
  sortOrder: number,
  filename: string,
  jti: string,
  expiresAt: number,
  secret: string,
): boolean {
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = signUploadUrl(
    postId,
    sortOrder,
    filename,
    jti,
    expiresAt,
    secret,
  );
  const actual = Buffer.from(sig);
  const reference = Buffer.from(expected);

  if (actual.length !== reference.length) {
    return false;
  }

  return timingSafeEqual(actual, reference);
}

/** Marks jti as spent. Returns false if already used or expired. */
export function redeemUploadJti(jti: string, expiresAt: number): boolean {
  pruneRedeemed();
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }
  if (redeemedJtis.has(jti)) {
    return false;
  }
  redeemedJtis.set(jti, expiresAt);
  return true;
}

/** Test helper — clear single-use registry between cases. */
export function resetUploadJtiRegistryForTests(): void {
  redeemedJtis.clear();
}

export function buildUploadAssetUrl(
  input: PrepareAssetUploadInput,
): PreparedAssetUpload {
  const ttlMs = input.ttlMs ?? UPLOAD_TTL_MS;
  const expiresAt = Date.now() + ttlMs;
  const jti = randomBytes(16).toString("base64url");
  const filename = input.filename.replace(/[/\\]/g, "").trim();
  if (!filename) {
    throw new Error("filename is required");
  }

  const sig = signUploadUrl(
    input.postId,
    input.sortOrder,
    filename,
    jti,
    expiresAt,
    input.secret,
  );
  const base = input.baseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    exp: String(expiresAt),
    sort: String(input.sortOrder),
    fn: filename,
    jti,
  });
  const uploadUrl = `${base}/upload/assets/${encodeURIComponent(sig)}/${encodeURIComponent(input.postId)}?${params.toString()}`;
  const maxBytes = getImageLimits().uploadMaxBytes;

  return {
    uploadUrl,
    expiresAt,
    maxBytes,
    sortOrder: input.sortOrder,
    filename,
    curlCommand: `curl -sf -X POST '${uploadUrl}' -F 'file=@LOCAL_IMAGE_PATH'`,
  };
}
