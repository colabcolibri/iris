import type { IncomingMessage, ServerResponse } from "node:http";

const LOCAL_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export function resolveAllowedOrigins(): Set<string> {
  const fromEnv =
    process.env.IRIS_CORS_ORIGINS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  return new Set(fromEnv);
}

export function isAllowedCorsOrigin(origin: string): boolean {
  if (origin === "null") {
    return true;
  }
  if (LOCAL_ORIGIN.test(origin)) {
    return true;
  }
  return resolveAllowedOrigins().has(origin);
}

/** Returns true when the preflight was handled. */
export function applyCorsIfNeeded(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  const origin = req.headers.origin;
  if (!origin || !isAllowedCorsOrigin(origin)) {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type",
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}
