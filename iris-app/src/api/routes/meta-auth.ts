import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { createMetaOAuthState, verifyMetaOAuthState } from "../../domain/meta-oauth-state.ts";
import {
  buildMetaAuthorizeUrl,
  createMetaOAuthClient,
} from "../../adapters/meta/meta-oauth-client.ts";
import { readMetaOAuthConfig } from "../../adapters/meta/meta-oauth-config.ts";
import { readSessionToken, verifySessionToken } from "../session.ts";
import { sessionSecret } from "../session.ts";

function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { Location: location });
  res.end();
}

function requireAdminSession(req: IncomingMessage): boolean {
  const secret = sessionSecret();
  if (!secret) {
    return false;
  }
  const session = verifySessionToken(readSessionToken(req));
  return session.ok;
}

export async function handleMetaAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (pathname !== "/auth/meta" && pathname !== "/auth/meta/callback") {
    return false;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
    return true;
  }

  const oauthConfig = readMetaOAuthConfig(ctx.publicBaseUrl ?? undefined);
  if (!oauthConfig) {
    res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("Meta OAuth is not configured");
    return true;
  }

  if (pathname === "/auth/meta") {
    if (!requireAdminSession(req)) {
      redirect(res, "/login.html");
      return true;
    }

    const secret = sessionSecret();
    if (!secret) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Session secret is not configured");
      return true;
    }

    const state = createMetaOAuthState(secret);
    const authorizeUrl = buildMetaAuthorizeUrl(oauthConfig, state);
    redirect(res, authorizeUrl);
    return true;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const error = url.searchParams.get("error");
  if (error) {
    redirect(res, `/?meta_error=denied`);
    return true;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const secret = sessionSecret();

  if (!code || !state || !secret || !verifyMetaOAuthState(state, secret)) {
    redirect(res, `/?meta_error=invalid_state`);
    return true;
  }

  const client = createMetaOAuthClient({ config: oauthConfig });
  const result = await client.completeFromCode(code);

  if (!result.ok) {
    redirect(res, `/?meta_error=${result.code}`);
    return true;
  }

  ctx.metaTokenStore.upsertToken(result.pageAccessToken, result.expiresAt);

  if (result.page.igUserId) {
    ctx.metaConnectionStore.upsert({
      igUserId: result.page.igUserId,
      igUsername: result.page.igUsername,
      pageId: result.page.pageId,
      pageName: result.page.pageName,
    });
  }

  redirect(res, "/?meta_connected=1");
  return true;
}
