import docsRoutes from "../../../docs-site/docs-routes.json" with { type: "json" };

const EXACT = docsRoutes.legacyExact as Record<string, string>;
const PREFIXES = [...docsRoutes.legacyPrefixes].sort(
  (a, b) => b.from.length - a.from.length,
);

/** Internal docs paths only — blocks open redirects and path traversal. */
export function isSafeDocsLocation(location: string): boolean {
  if (!location.startsWith(docsRoutes.allowedPrefix)) {
    return false;
  }
  if (
    location.includes("..") ||
    location.includes("\\") ||
    location.includes("//") ||
    location.includes("?") ||
    location.includes("#")
  ) {
    return false;
  }
  try {
    const { pathname } = new URL(location, "http://localhost");
    return pathname === location || location.endsWith("/");
  } catch {
    return false;
  }
}

function safeLegacySuffix(suffix: string): boolean {
  if (suffix === "") {
    return true;
  }
  if (!suffix.startsWith("/")) {
    return false;
  }
  if (/[?#:\\]/.test(suffix) || suffix.includes("..") || suffix.includes("//")) {
    return false;
  }
  return /^\/[\w./-]*$/.test(suffix);
}

/** Resolve canonical docs URL for GET/HEAD, or null if not a docs redirect. */
export function resolveDocsRedirect(pathname: string): string | null {
  const exact = EXACT[pathname];
  if (exact && isSafeDocsLocation(exact)) {
    return exact;
  }

  for (const { from, to } of PREFIXES) {
    if (pathname === from) {
      const target = `${to}/`;
      return isSafeDocsLocation(target) ? target : null;
    }
    if (!pathname.startsWith(`${from}/`)) {
      continue;
    }
    const suffix = pathname.slice(from.length);
    if (!safeLegacySuffix(suffix)) {
      return null;
    }
    const target = `${to}${suffix}`;
    return isSafeDocsLocation(target) ? target : null;
  }

  return null;
}

export const docsHomePt = docsRoutes.home.pt;
export const docsNotFoundFallback = docsRoutes.notFoundFallback;
