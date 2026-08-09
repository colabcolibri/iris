export const META_OAUTH_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_comments",
  "pages_show_list",
  "pages_read_engagement",
] as const;

export type MetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphApiVersion: string;
};

export function readMetaOAuthConfig(publicBaseUrl?: string): MetaOAuthConfig | null {
  const appId = process.env.META_APP_ID?.trim() ?? "";
  const appSecret = process.env.META_APP_SECRET?.trim() ?? "";
  const graphApiVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  const redirectUri =
    process.env.META_OAUTH_REDIRECT_URI?.trim() ||
    (publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/auth/meta/callback` : "");

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return { appId, appSecret, redirectUri, graphApiVersion };
}
