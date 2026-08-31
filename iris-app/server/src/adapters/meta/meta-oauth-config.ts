/** Instagram API with Instagram Login — posts + comments only. */
export const META_OAUTH_SCOPES_ESSENTIAL = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
] as const;

/** Insights + DMs on top of essential scopes. */
export const META_OAUTH_SCOPES_EXTENDED = [
  "instagram_business_manage_insights",
  "instagram_business_manage_messages",
] as const;

/** Full Instagram Login scope set (backward compatible). */
export const META_OAUTH_SCOPES = [
  ...META_OAUTH_SCOPES_ESSENTIAL,
  ...META_OAUTH_SCOPES_EXTENDED,
] as const;

export type MetaOAuthConnectMode = "essential" | "full";

export const META_FACEBOOK_PAGE_SCOPES = [
  "pages_messaging",
  "pages_show_list",
] as const;

export function metaOAuthScopesForMode(mode: MetaOAuthConnectMode): string[] {
  if (mode === "essential") {
    return [...META_OAUTH_SCOPES_ESSENTIAL];
  }
  return [...META_OAUTH_SCOPES];
}

export type MetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphApiVersion: string;
};

export function readMetaFacebookAppCredentials(): {
  appId: string;
  appSecret: string;
} | null {
  const appId = process.env.META_APP_ID?.trim() || "";
  const appSecret = process.env.META_APP_SECRET?.trim() || "";
  if (!appId || !appSecret) {
    return null;
  }
  return { appId, appSecret };
}

export function metaPageOAuthRedirectUri(publicBaseUrl?: string): string {
  const explicit = process.env.META_PAGE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit;
  }
  const base = publicBaseUrl?.replace(/\/$/, "") || "";
  return base ? `${base}/auth/meta/page/callback` : "";
}

export function readMetaOAuthConfig(publicBaseUrl?: string): MetaOAuthConfig | null {
  // Instagram Login uses Instagram App ID/Secret from
  // Dashboard → Instagram → API setup with Instagram login → Business login settings
  const appId =
    process.env.META_INSTAGRAM_APP_ID?.trim() ||
    process.env.META_APP_ID?.trim() ||
    "";
  const appSecret =
    process.env.META_INSTAGRAM_APP_SECRET?.trim() ||
    process.env.META_APP_SECRET?.trim() ||
    "";
  const graphApiVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  const redirectUri =
    process.env.META_OAUTH_REDIRECT_URI?.trim() ||
    (publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/auth/meta/callback` : "");

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return { appId, appSecret, redirectUri, graphApiVersion };
}

export function instagramGraphBase(version: string): string {
  return `https://graph.instagram.com/${version}`;
}
