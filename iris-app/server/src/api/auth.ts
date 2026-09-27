import type { IncomingMessage } from "node:http";
import { timingSafeStringEqual } from "../domain/auth/secret-compare.ts";
import { readSessionToken, verifySessionToken } from "./session.ts";

export type AuthRole = "admin" | "agent";

export type AuthContext = {
  role: AuthRole;
  token?: string;
  email?: string;
  accountId?: string;
};

export type AuthConfig = {
  adminToken: string;
  agentToken: string;
};

export type AuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; status: 401 | 403; message: string };

export function extractBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function authenticateRequest(
  req: IncomingMessage,
  config: AuthConfig,
): AuthResult {
  const sessionToken = readSessionToken(req);
  const session = verifySessionToken(sessionToken);
  if (session.ok) {
    return {
      ok: true,
      context: { role: "admin", email: session.email, accountId: session.accountId },
    };
  }

  const token = extractBearerToken(req);

  if (!token) {
    return { ok: false, status: 401, message: "Authorization required" };
  }

  if (config.adminToken && timingSafeStringEqual(config.adminToken, token)) {
    return { ok: true, context: { role: "admin", token } };
  }

  if (config.agentToken && timingSafeStringEqual(config.agentToken, token)) {
    return { ok: true, context: { role: "agent", token } };
  }

  return { ok: false, status: 403, message: "Invalid token" };
}

export function requireAdmin(auth: AuthContext): boolean {
  return auth.role === "admin";
}
