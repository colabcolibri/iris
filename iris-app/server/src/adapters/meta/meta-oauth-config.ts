/** Instagram API with Instagram Login — business scopes (no Facebook Page). */
export const META_OAUTH_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
  // Meta app review v1.9 — operador deve reconectar após deploy
  "instagram_business_manage_insights",
  "instagram_business_manage_messages",
] as const;

export type MetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphApiVersion: string;
};

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
