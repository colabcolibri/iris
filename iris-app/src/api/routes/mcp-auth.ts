import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import { validateMcpConnectionCode } from "../../domain/mcp-connection.ts";

const INVALID_CONNECTION_MESSAGE = "Invalid connection code";

export async function handleMcpAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (pathname !== "/api/mcp/validate" || req.method !== "POST") {
    return false;
  }

  try {
    const body = await readJsonBody<{ connectionCode?: unknown }>(req);
    const connectionCode =
      typeof body.connectionCode === "string" ? body.connectionCode : "";

    if (
      !validateMcpConnectionCode(connectionCode, ctx.mcp.connectionCode)
    ) {
      sendError(res, 401, INVALID_CONNECTION_MESSAGE);
      return true;
    }

    sendJson(res, 200, {
      valid: true,
      server: "iris",
      mcpPath: "/mcp",
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BodyTooLargeError) {
      sendError(res, 401, INVALID_CONNECTION_MESSAGE);
      return true;
    }

    sendError(res, 500, "internal server error");
  }

  return true;
}
