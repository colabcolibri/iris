import type { MetaOAuthConfig } from "./meta-oauth-config.ts";
import {
  type MetaOAuthConnectMode,
  metaOAuthScopesForMode,
} from "./meta-oauth-config.ts";

type ShortTokenResponse = {
  access_token?: string;
  user_id?: string | number;
  data?: Array<{
    access_token?: string;
    user_id?: string | number;
  }>;
  error_message?: string;
};

type LongTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: { message?: string; code?: number };
};

type IgProfileResponse = {
  user_id?: string;
  username?: string;
  error?: { message?: string; code?: number };
};

export type MetaOAuthClientOptions = {
  config: MetaOAuthConfig;
  fetchImpl?: typeof fetch;
};

export type MetaInstagramAccount = {
  igUserId: string;
  igUsername: string | null;
  accessToken: string;
};

export type MetaOAuthExchangeResult =
  | {
      ok: true;
      accessToken: string;
      expiresAt: string | null;
      account: MetaInstagramAccount;
    }
  | { ok: false; code: "exchange_failed" | "profile_failed" };

export function buildMetaAuthorizeUrl(
  config: MetaOAuthConfig,
  state: string,
  mode: MetaOAuthConnectMode = "full",
): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
    scope: metaOAuthScopesForMode(mode).join(","),
    response_type: "code",
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

function parseShortTokenResponse(json: ShortTokenResponse): {
  accessToken: string;
  userId: string | null;
} | null {
  const row = json.data?.[0];
  const accessToken = row?.access_token ?? json.access_token;
  const userIdRaw = row?.user_id ?? json.user_id;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    userId: userIdRaw != null ? String(userIdRaw) : null,
  };
}

export function createMetaOAuthClient(options: MetaOAuthClientOptions) {
  const fetchFn = options.fetchImpl ?? fetch;
  const { config } = options;
  const graphBase = `https://graph.instagram.com/${config.graphApiVersion}`;

  async function exchangeCodeForShortToken(code: string): Promise<{
    accessToken: string;
    userId: string | null;
  } | null> {
    const body = new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
      code,
    });

    const response = await fetchFn("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const json = (await response.json()) as ShortTokenResponse;
    if (!response.ok) {
      return null;
    }

    return parseShortTokenResponse(json);
  }

  async function exchangeLongLivedToken(shortToken: string): Promise<{
    token: string;
    expiresAt: string | null;
  } | null> {
    const params = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: config.appSecret,
      access_token: shortToken,
    });

    const response = await fetchFn(
      `https://graph.instagram.com/access_token?${params.toString()}`,
    );
    const json = (await response.json()) as LongTokenResponse;

    if (!json.access_token) {
      return null;
    }

    const expiresAt =
      json.expires_in && Number.isFinite(json.expires_in)
        ? new Date(Date.now() + json.expires_in * 1000).toISOString()
        : null;

    return { token: json.access_token, expiresAt };
  }

  async function fetchIgProfile(
    token: string,
  ): Promise<{ igUserId: string; igUsername: string | null } | null> {
    const params = new URLSearchParams({
      fields: "user_id,username",
      access_token: token,
    });

    const response = await fetchFn(`${graphBase}/me?${params.toString()}`);
    const json = (await response.json()) as IgProfileResponse;

    const igUserId = json.user_id;
    if (!response.ok || !igUserId) {
      return null;
    }

    return {
      igUserId,
      igUsername: json.username ?? null,
    };
  }

  return {
    async completeFromCode(code: string): Promise<MetaOAuthExchangeResult> {
      const short = await exchangeCodeForShortToken(code);
      if (!short) {
        return { ok: false, code: "exchange_failed" };
      }

      const longLived = await exchangeLongLivedToken(short.accessToken);
      if (!longLived) {
        return { ok: false, code: "exchange_failed" };
      }

      const profile = await fetchIgProfile(longLived.token);
      const igUserId = profile?.igUserId ?? short.userId;
      if (!igUserId) {
        return { ok: false, code: "profile_failed" };
      }

      return {
        ok: true,
        accessToken: longLived.token,
        expiresAt: longLived.expiresAt,
        account: {
          igUserId,
          igUsername: profile?.igUsername ?? null,
          accessToken: longLived.token,
        },
      };
    },
  };
}
