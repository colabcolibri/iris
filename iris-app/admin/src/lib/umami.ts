const DEFAULT_SCRIPT_URL = "https://umami.sergioluciano.com/script.js";

export const umamiConfig = {
  websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() ?? "",
  scriptUrl:
    import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() || DEFAULT_SCRIPT_URL,
} as const;

export function isUmamiEnabled(): boolean {
  return umamiConfig.websiteId.length > 0;
}
