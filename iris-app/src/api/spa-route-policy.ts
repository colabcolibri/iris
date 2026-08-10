const PROTECTED_SPA_PATHS = new Set(["/", "/comments", "/settings", "/persona"]);

const PUBLIC_SPA_PATHS = new Set([
  "/login",
  "/privacy",
  "/privacy-policy",
  "/login.html",
]);

export function isProtectedSpaPath(pathname: string): boolean {
  return PROTECTED_SPA_PATHS.has(pathname);
}

export function isPublicSpaPath(pathname: string): boolean {
  return PUBLIC_SPA_PATHS.has(pathname);
}

export function shouldGateSpaGet(pathname: string, method: string): boolean {
  if (method !== "GET") {
    return false;
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/meta")) {
    return false;
  }

  if (isPublicSpaPath(pathname)) {
    return false;
  }

  if (pathname.includes(".") && !pathname.endsWith(".html")) {
    return false;
  }

  return isProtectedSpaPath(pathname);
}
