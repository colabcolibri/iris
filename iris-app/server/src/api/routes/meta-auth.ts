import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import {
  createMetaOAuthState,
  verifyMetaOAuthState,
} from "../../domain/meta/meta-oauth-state.ts";
import {
  buildMetaAuthorizeUrl,
  createMetaOAuthClient,
} from "../../adapters/meta/meta-oauth-client.ts";
import {
  buildFacebookPageAuthorizeUrl,
  createMetaPageOAuthClient,
} from "../../adapters/meta/meta-page-oauth-client.ts";
import {
  metaPageOAuthRedirectUri,
  readMetaFacebookAppCredentials,
  readMetaOAuthConfig,
  type MetaOAuthConnectMode,
} from "../../adapters/meta/meta-oauth-config.ts";
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

function parseConnectMode(raw: string | null): MetaOAuthConnectMode {
  return raw === "essential" ? "essential" : "full";
}

function preservePageOnIgReconnect(ctx: AppContext): {
  pageId: string;
  pageName: string | null;
} {
  const existing = ctx.metaConnectionStore.get();
  if (existing && existing.pageId !== "instagram-login") {
    return { pageId: existing.pageId, pageName: existing.pageName };
  }
  return { pageId: "instagram-login", pageName: null };
}

export async function handleMetaAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  const isIgStart = pathname === "/auth/meta";
  const isIgCallback = pathname === "/auth/meta/callback";
  const isPageStart = pathname === "/auth/meta/page";
  const isPageCallback = pathname === "/auth/meta/page/callback";

  if (!isIgStart && !isIgCallback && !isPageStart && !isPageCallback) {
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

  if (isIgStart) {
    if (!requireAdminSession(req)) {
      redirect(res, "/admin/login");
      return true;
    }

    const secret = sessionSecret();
    if (!secret) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Session secret is not configured");
      return true;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const mode = parseConnectMode(url.searchParams.get("mode"));
    const state = createMetaOAuthState(secret, "instagram");
    const authorizeUrl = buildMetaAuthorizeUrl(oauthConfig, state, mode);
    redirect(res, authorizeUrl);
    return true;
  }

  if (isPageStart) {
    if (!requireAdminSession(req)) {
      redirect(res, "/admin/login");
      return true;
    }

    const secret = sessionSecret();
    const facebookCreds = readMetaFacebookAppCredentials();
    const pageRedirectUri = metaPageOAuthRedirectUri(ctx.publicBaseUrl ?? undefined);

    if (!secret || !facebookCreds || !pageRedirectUri) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Facebook Page OAuth is not configured");
      return true;
    }

    const state = createMetaOAuthState(secret, "page");
    const authorizeUrl = buildFacebookPageAuthorizeUrl(
      facebookCreds.appId,
      pageRedirectUri,
      state,
      oauthConfig.graphApiVersion,
    );
    redirect(res, authorizeUrl);
    return true;
  }

  if (isPageCallback) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const error = url.searchParams.get("error");
    if (error) {
      redirect(res, `/admin/settings?meta_page_error=denied`);
      return true;
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const secret = sessionSecret();
    const pageRedirectUri = metaPageOAuthRedirectUri(ctx.publicBaseUrl ?? undefined);

    if (
      !code ||
      !state ||
      !secret ||
      !pageRedirectUri ||
      !verifyMetaOAuthState(state, secret, "page")
    ) {
      redirect(res, `/admin/settings?meta_page_error=invalid_state`);
      return true;
    }

    const client = createMetaPageOAuthClient({
      config: oauthConfig,
      pageRedirectUri,
    });
    const result = await client.completeFromCode(code);

    if (!result.ok) {
      redirect(res, `/admin/settings?meta_page_error=${result.code}`);
      return true;
    }

    const updated = ctx.metaConnectionStore.upsertPageCredentials({
      pageId: result.page.pageId,
      pageName: result.page.pageName,
      pageAccessToken: result.page.pageAccessToken,
    });

    if (!updated) {
      redirect(res, `/admin/settings?meta_page_error=not_connected`);
      return true;
    }

    redirect(res, "/admin/settings?meta_page_connected=1");
    return true;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const error = url.searchParams.get("error");
  if (error) {
    redirect(res, `/admin?meta_error=denied`);
    return true;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const secret = sessionSecret();

  if (!code || !state || !secret || !verifyMetaOAuthState(state, secret, "instagram")) {
    redirect(res, `/admin?meta_error=invalid_state`);
    return true;
  }

  const client = createMetaOAuthClient({ config: oauthConfig });
  const result = await client.completeFromCode(code);

  if (!result.ok) {
    redirect(res, `/admin?meta_error=${result.code}`);
    return true;
  }

  ctx.metaTokenStore.upsertToken(result.accessToken, result.expiresAt);

  const preservedPage = preservePageOnIgReconnect(ctx);

  ctx.metaConnectionStore.upsert({
    igUserId: result.account.igUserId,
    igUsername: result.account.igUsername,
    pageId: preservedPage.pageId,
    pageName: preservedPage.pageName,
  });

  redirect(res, "/admin/settings?meta_connected=1");
  return true;
}
