import { ADMIN_BASE } from "@/lib/routes";

export const umamiConfig = {
  websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() ?? "",
  scriptUrl: import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() ?? "",
} as const;

/** Ativo só com as duas variáveis VITE definidas no build — sem defaults embutidos. */
export function isUmamiEnabled(): boolean {
  return umamiConfig.websiteId.length > 0 && umamiConfig.scriptUrl.length > 0;
}

export function isUmamiExcludedPath(pathname: string): boolean {
  return pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`);
}

export function shouldTrackUmamiPath(pathname: string): boolean {
  return isUmamiEnabled() && !isUmamiExcludedPath(pathname);
}

export function umamiScriptSelector(): string {
  return `script[data-website-id="${umamiConfig.websiteId}"]`;
}
