const DEFAULT_SCRIPT_URL = "https://umami.sergioluciano.com/script.js";

export const umamiConfig = {
  websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() ?? "",
  scriptUrl:
    import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() || DEFAULT_SCRIPT_URL,
} as const;

export function isUmamiEnabled(): boolean {
  return umamiConfig.websiteId.length > 0;
}

/** Landing, privacidade e demo — nunca `/admin` (uso interno). */
export function shouldTrackUmamiPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/en") return true;
  if (pathname === "/privacy" || pathname === "/privacy-policy") return true;
  if (pathname === "/demo" || pathname.startsWith("/demo/")) return true;
  return false;
}

export function umamiScriptSelector(): string {
  return `script[data-website-id="${umamiConfig.websiteId}"]`;
}
