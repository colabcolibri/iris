import {
  META_FACEBOOK_PAGE_SCOPES,
  readMetaFacebookAppCredentials,
  type MetaOAuthConfig,
} from "./meta-oauth-config.ts";

type TokenExchangeResponse = {
  access_token?: string;
  error?: { message?: string; code?: number };
};

type AccountsResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
  }>;
  error?: { message?: string; code?: number };
};

export type MetaPageOAuthClientOptions = {
  config: MetaOAuthConfig;
  pageRedirectUri: string;
  fetchImpl?: typeof fetch;
};

export type MetaPageAccount = {
  pageId: string;
  pageName: string | null;
  pageAccessToken: string;
};

export type MetaPageOAuthExchangeResult =
  | { ok: true; page: MetaPageAccount }
  | { ok: false; code: "exchange_failed" | "no_page" };

export function buildFacebookPageAuthorizeUrl(
  appId: string,
  redirectUri: string,
  state: string,
  graphApiVersion: string,
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_FACEBOOK_PAGE_SCOPES.join(","),
    response_type: "code",
  });

  return `https://www.facebook.com/${graphApiVersion}/dialog/oauth?${params.toString()}`;
}

export function createMetaPageOAuthClient(options: MetaPageOAuthClientOptions) {
  const fetchFn = options.fetchImpl ?? fetch;
  const { config, pageRedirectUri } = options;
  const facebookBase = `https://graph.facebook.com/${config.graphApiVersion}`;
  const facebookCreds = readMetaFacebookAppCredentials();

  if (!facebookCreds) {
    return {
      async completeFromCode(): Promise<MetaPageOAuthExchangeResult> {
        return { ok: false, code: "exchange_failed" };
      },
    };
  }

  async function exchangeCodeForUserToken(code: string): Promise<string | null> {
    const params = new URLSearchParams({
      client_id: facebookCreds.appId,
      client_secret: facebookCreds.appSecret,
      redirect_uri: pageRedirectUri,
      code,
    });

    const response = await fetchFn(
      `${facebookBase}/oauth/access_token?${params.toString()}`,
    );
    const json = (await response.json()) as TokenExchangeResponse;
    if (!response.ok || !json.access_token) {
      return null;
    }
    return json.access_token;
  }

  async function fetchFirstPageAccount(userToken: string): Promise<MetaPageAccount | null> {
    const params = new URLSearchParams({
      fields: "id,name,access_token",
      access_token: userToken,
    });

    const response = await fetchFn(`${facebookBase}/me/accounts?${params.toString()}`);
    const json = (await response.json()) as AccountsResponse;
    if (!response.ok || !Array.isArray(json.data)) {
      return null;
    }

    const row = json.data.find((item) => item.id && item.access_token);
    if (!row?.id || !row.access_token) {
      return null;
    }

    return {
      pageId: row.id,
      pageName: row.name ?? null,
      pageAccessToken: row.access_token,
    };
  }

  return {
    async completeFromCode(code: string): Promise<MetaPageOAuthExchangeResult> {
      const userToken = await exchangeCodeForUserToken(code);
      if (!userToken) {
        return { ok: false, code: "exchange_failed" };
      }

      const page = await fetchFirstPageAccount(userToken);
      if (!page) {
        return { ok: false, code: "no_page" };
      }

      return { ok: true, page };
    },
  };
}
