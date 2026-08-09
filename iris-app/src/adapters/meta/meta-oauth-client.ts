import type { MetaOAuthConfig } from "./meta-oauth-config.ts";
import { META_OAUTH_SCOPES } from "./meta-oauth-config.ts";

type GraphTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string; code?: number };
};

type GraphAccountsResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: { id?: string; username?: string };
  }>;
  error?: { message?: string; code?: number };
};

export type MetaOAuthClientOptions = {
  config: MetaOAuthConfig;
  fetchImpl?: typeof fetch;
};

export type MetaPageAccount = {
  pageId: string;
  pageName: string | null;
  pageAccessToken: string;
  igUserId: string | null;
  igUsername: string | null;
};

export type MetaOAuthExchangeResult =
  | {
      ok: true;
      pageAccessToken: string;
      expiresAt: string | null;
      page: MetaPageAccount;
    }
  | { ok: false; code: "exchange_failed" | "no_pages" | "no_ig_linked" };

export function buildMetaAuthorizeUrl(
  config: MetaOAuthConfig,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
    scope: META_OAUTH_SCOPES.join(","),
    response_type: "code",
  });

  return `https://www.facebook.com/${config.graphApiVersion}/dialog/oauth?${params.toString()}`;
}

export function createMetaOAuthClient(options: MetaOAuthClientOptions) {
  const fetchFn = options.fetchImpl ?? fetch;
  const { config } = options;
  const graphBase = `https://graph.facebook.com/${config.graphApiVersion}`;

  async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const search = new URLSearchParams(params);
    const response = await fetchFn(`${graphBase}${path}?${search.toString()}`);
    return (await response.json()) as T;
  }

  async function exchangeCodeForUserToken(code: string): Promise<string | null> {
    const json = await graphGet<GraphTokenResponse>("/oauth/access_token", {
      client_id: config.appId,
      client_secret: config.appSecret,
      redirect_uri: config.redirectUri,
      code,
    });

    if (!json.access_token) {
      return null;
    }

    return json.access_token;
  }

  async function exchangeLongLivedUserToken(shortToken: string): Promise<{
    token: string;
    expiresAt: string | null;
  } | null> {
    const json = await graphGet<GraphTokenResponse>("/oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: config.appId,
      client_secret: config.appSecret,
      fb_exchange_token: shortToken,
    });

    if (!json.access_token) {
      return null;
    }

    const expiresAt =
      json.expires_in && Number.isFinite(json.expires_in)
        ? new Date(Date.now() + json.expires_in * 1000).toISOString()
        : null;

    return { token: json.access_token, expiresAt };
  }

  async function fetchPageAccounts(userToken: string): Promise<MetaPageAccount[]> {
    const json = await graphGet<GraphAccountsResponse>("/me/accounts", {
      access_token: userToken,
      fields: "id,name,access_token,instagram_business_account{id,username}",
    });

    if (!json.data?.length) {
      return [];
    }

    return json.data
      .filter((row) => row.id && row.access_token)
      .map((row) => ({
        pageId: row.id!,
        pageName: row.name ?? null,
        pageAccessToken: row.access_token!,
        igUserId: row.instagram_business_account?.id ?? null,
        igUsername: row.instagram_business_account?.username ?? null,
      }));
  }

  return {
    async completeFromCode(code: string): Promise<MetaOAuthExchangeResult> {
      const shortToken = await exchangeCodeForUserToken(code);
      if (!shortToken) {
        return { ok: false, code: "exchange_failed" };
      }

      const longLived = await exchangeLongLivedUserToken(shortToken);
      if (!longLived) {
        return { ok: false, code: "exchange_failed" };
      }

      const pages = await fetchPageAccounts(longLived.token);
      if (pages.length === 0) {
        return { ok: false, code: "no_pages" };
      }

      const pageWithIg = pages.find((page) => page.igUserId);
      if (!pageWithIg) {
        return { ok: false, code: "no_ig_linked" };
      }

      return {
        ok: true,
        pageAccessToken: pageWithIg.pageAccessToken,
        expiresAt: longLived.expiresAt,
        page: pageWithIg,
      };
    },
  };
}
