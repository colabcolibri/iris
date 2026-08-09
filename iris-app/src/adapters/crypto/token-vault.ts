import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function resolveEncryptionKey(
  envKey?: string,
  isProduction = process.env.NODE_ENV === "production",
): Buffer {
  if (envKey) {
    if (envKey.length === 64 && /^[0-9a-f]+$/i.test(envKey)) {
      return Buffer.from(envKey, "hex");
    }

    return scryptSync(envKey, "iris-token-vault", 32);
  }

  if (isProduction) {
    throw new Error("IRIS_TOKEN_ENCRYPTION_KEY is required in production");
  }

  console.warn(
    "[iris] using dev default IRIS_TOKEN_ENCRYPTION_KEY — not for production",
  );

  return scryptSync("iris-dev-token-encryption-key", "iris-token-vault", 32);
}

export function encryptToken(plain: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(vault: string, key: Buffer): string {
  const data = Buffer.from(vault, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
