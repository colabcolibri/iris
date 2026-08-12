import { ADMIN_BASE } from "@/lib/routes";

const DEFAULT_SCRIPT_URL = "https://umami.sergioluciano.com/script.js";

/** Redirects legados que apontam para rotas do admin — não rastrear. */
const UMAMI_EXCLUDED_LEGACY_ADMIN_PATHS = [
  "/login",
  "/login.html",
  "/comments",
  "/settings",
  "/persona",
  "/webhooks",
  "/agent-runs",
  "/agent-simulator",
] as const;

export const umamiConfig = {
  websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() ?? "",
  scriptUrl:
    import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() || DEFAULT_SCRIPT_URL,
} as const;

export function isUmamiEnabled(): boolean {
  return umamiConfig.websiteId.length > 0;
}

export function isUmamiExcludedPath(pathname: string): boolean {
  if (pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`)) {
    return true;
  }

  return UMAMI_EXCLUDED_LEGACY_ADMIN_PATHS.some((path) => pathname === path);
}

export function shouldTrackUmamiPath(pathname: string): boolean {
  return isUmamiEnabled() && !isUmamiExcludedPath(pathname);
}

export function umamiScriptSelector(): string {
  return `script[data-website-id="${umamiConfig.websiteId}"]`;
}
