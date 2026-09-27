import { createHmac } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeStringEqual } from "../domain/auth/secret-compare.ts";

export const SESSION_COOKIE = "iris_session";
const SESSION_VERSION = "v1";

export function sessionSecret(): string | null {
  const secret = process.env.IRIS_SESSION_SECRET?.trim();
  return secret || null;
}

export function sessionMaxAgeSeconds(): number {
  const raw = Number(process.env.IRIS_SESSION_MAX_AGE_SEC ?? 86_400);
  return Number.isFinite(raw) && raw > 0 ? raw : 86_400;
}

function signSessionPayload(expiresAtMs: number, secret: string): string {
  const payload = `${SESSION_VERSION}.${expiresAtMs}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function createSessionToken(email: string, accountId?: string): string {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error("IRIS_SESSION_SECRET is not configured");
  }

  const expiresAtMs = Date.now() + sessionMaxAgeSeconds() * 1000;
  if (!accountId) {
    const token = signSessionPayload(expiresAtMs, secret);
    return `${token}.${Buffer.from(email, "utf8").toString("base64url")}`;
  }

  const emailPart = Buffer.from(email, "utf8").toString("base64url");
  const payload = `${SESSION_VERSION}.${expiresAtMs}.${emailPart}.${accountId}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): {
  ok: boolean;
  email?: string;
  accountId?: string;
} {
  if (!token?.trim()) {
    return { ok: false };
  }

  const secret = sessionSecret();
  if (!secret) {
    return { ok: false };
  }

  const parts = token.trim().split(".");
  if (parts.length === 5 && parts[0] === SESSION_VERSION) {
    const expiresAtMs = Number(parts[1]);
    if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
      return { ok: false };
    }
    const payload = `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`;
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
    if (!timingSafeStringEqual(parts[4]!, expectedSignature)) {
      return { ok: false };
    }
    try {
      const email = Buffer.from(parts[2]!, "base64url").toString("utf8");
      return { ok: true, email, accountId: parts[3] };
    } catch {
      return { ok: false };
    }
  }

  if (parts.length !== 4 || parts[0] !== SESSION_VERSION) {
    return { ok: false };
  }

  const expiresAtMs = Number(parts[1]);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
    return { ok: false };
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!timingSafeStringEqual(parts[2]!, expectedSignature)) {
    return { ok: false };
  }

  try {
    const email = Buffer.from(parts[3]!, "base64url").toString("utf8");
    return { ok: true, email };
  } catch {
    return { ok: false };
  }
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (!rawName || rest.length === 0) {
      continue;
    }
    cookies[rawName] = decodeURIComponent(rest.join("="));
  }

  return cookies;
}

export function readSessionToken(req: IncomingMessage): string | null {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[SESSION_COOKIE] ?? null;
}

export function appendSessionCookie(res: ServerResponse, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${sessionMaxAgeSeconds()}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res: ServerResponse): void {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}
