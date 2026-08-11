import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const ADMIN_OTP_MAX_ATTEMPTS = 5;
export const ADMIN_OTP_RESEND_SECONDS = 60;

export function otpPepper(): string {
  const pepper = process.env.IRIS_OTP_PEPPER?.trim();
  if (!pepper) {
    throw new Error("IRIS_OTP_PEPPER is not configured");
  }
  return pepper;
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(code: string, pepper = otpPepper()): string {
  return createHash("sha256").update(`${code.trim()}${pepper}`).digest("hex");
}

export function verifyOtpCode(code: string, hash: string, pepper = otpPepper()): boolean {
  const expected = hashOtpCode(code, pepper);
  const a = Buffer.from(expected);
  const b = Buffer.from(hash);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function resolveOtpTtlMs(): number {
  const minutes = Number.parseInt(process.env.IRIS_OTP_TTL_MINUTES ?? "15", 10);
  return Math.max(5, Number.isFinite(minutes) ? minutes : 15) * 60_000;
}

export function normalizeOtpCodeInput(code: string): string {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("code_invalid");
  }
  return trimmed;
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolveAdminEmailAllowlist(): string | null {
  const email = process.env.IRIS_ADMIN_EMAIL?.trim().toLowerCase();
  return email && email.includes("@") ? email : null;
}

export function isEmailAllowlisted(email: string): boolean {
  const allowed = resolveAdminEmailAllowlist();
  if (!allowed) {
    return false;
  }
  return normalizeAdminEmail(email) === allowed;
}

export type OtpChallengeRecord = {
  email: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  lastRequestAt: string;
};

export function hasActiveOtpResendCooldown(
  record: OtpChallengeRecord | null | undefined,
): boolean {
  if (!record?.lastRequestAt || !record.expiresAt) {
    return false;
  }

  if (Date.now() >= new Date(record.expiresAt).getTime()) {
    return false;
  }

  const elapsedMs = Date.now() - new Date(record.lastRequestAt).getTime();
  return elapsedMs < ADMIN_OTP_RESEND_SECONDS * 1000;
}
