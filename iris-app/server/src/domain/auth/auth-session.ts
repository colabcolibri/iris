import type { IncomingMessage } from "node:http";
import { readSessionToken, verifySessionToken } from "../../api/session.ts";

export type AdminSession = {
  ok: true;
  email: string;
  accountId?: string;
};

export function readAdminSession(req: IncomingMessage): AdminSession | { ok: false } {
  const session = verifySessionToken(readSessionToken(req));
  if (!session.ok || !session.email) {
    return { ok: false };
  }

  return { ok: true, email: session.email, accountId: session.accountId };
}
