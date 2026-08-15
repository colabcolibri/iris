const PUBLIC_SPA_PATHS = new Set(["/", "/en", "/privacy", "/privacy-policy"]);

const ADMIN_LOGIN_PATHS = new Set(["/admin/login", "/admin/login.html"]);

const LEGACY_ADMIN_REDIRECTS: Record<string, string> = {
  "/login": "/admin/login",
  "/login.html": "/admin/login",
  "/comments": "/admin/comments",
  "/settings": "/admin/settings",
  "/persona": "/admin/persona",
  "/webhooks": "/admin/webhooks",
  "/agent-runs": "/admin/agent-runs",
  "/agent-simulator": "/admin/agent-simulator",
};

export function resolveLegacyAdminRedirect(pathname: string): string | null {
  return LEGACY_ADMIN_REDIRECTS[pathname] ?? null;
}

/** Docs URL rewrites — must use full `/docs/...` paths (Astro base breaks otherwise). */
export function resolveDocsRedirect(pathname: string): string | null {
  if (pathname === "/docs" || pathname === "/docs/") {
    return "/docs/inicio/";
  }
  if (pathname === "/docs/en" || pathname === "/docs/en/") {
    return "/docs/en/inicio/";
  }
  if (pathname === "/docs/meta" || pathname === "/docs/meta/") {
    return "/docs/configuracao/";
  }
  if (pathname.startsWith("/docs/meta/")) {
    const suffix = pathname.slice("/docs/meta".length);
    return `/docs/configuracao${suffix}`;
  }
  if (pathname === "/docs/en/meta" || pathname === "/docs/en/meta/") {
    return "/docs/en/configuracao/";
  }
  if (pathname.startsWith("/docs/en/meta/")) {
    const suffix = pathname.slice("/docs/en/meta".length);
    return `/docs/en/configuracao${suffix}`;
  }
  return null;
}

export function isProtectedSpaPath(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) {
    return false;
  }

  return !ADMIN_LOGIN_PATHS.has(pathname);
}

export function isPublicSpaPath(pathname: string): boolean {
  if (PUBLIC_SPA_PATHS.has(pathname)) {
    return true;
  }

  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return true;
  }

  return ADMIN_LOGIN_PATHS.has(pathname);
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
