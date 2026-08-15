import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import type { ServerResponse } from "node:http";
import {
  docsNotFoundFallback,
  isSafeDocsLocation,
} from "./docs-route-policy.ts";

/** Handle missing static file under `/docs/*` — never JSON for browser navigation. */
export function serveDocsNotFound(
  pathname: string,
  res: ServerResponse,
  publicDir: string,
): boolean {
  if (!pathname.startsWith("/docs")) {
    return false;
  }

  const docs404 = join(publicDir, "docs/404.html");
  if (existsSync(docs404)) {
    const body = readFileSync(docs404);
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
    return true;
  }

  if (isSafeDocsLocation(docsNotFoundFallback)) {
    res.writeHead(302, { Location: docsNotFoundFallback });
    res.end();
    return true;
  }

  return false;
}

export function sendSafeRedirect(res: ServerResponse, location: string): boolean {
  if (!isSafeDocsLocation(location)) {
    return false;
  }
  res.writeHead(302, { Location: location });
  res.end();
  return true;
}
