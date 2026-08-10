import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import {
  BodyTooLargeError,
  readJsonBody,
  sendError,
  sendJson,
  ValidationError,
} from "../json.ts";
import { normalizeAgentContentBody } from "../../domain/agent-content.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

function serializeAgentContent(content: AgentContent) {
  return {
    soul: content.soul,
    page: content.page,
    knowledge: content.knowledge,
    restrictions: content.restrictions,
    updated_at: content.updatedAt,
  };
}

export async function handleAgentContentSettingsRoute(
  request: RouteRequest,
): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/settings/agent-content") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method === "GET") {
    sendJson(res, 200, serializeAgentContent(ctx.agentContentStore.get()));
    return true;
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req);
      const input = normalizeAgentContentBody(body);
      const saved = ctx.agentContentStore.upsert(input);
      sendJson(res, 200, serializeAgentContent(saved));
    } catch (error) {
      if (error instanceof ValidationError) {
        sendError(res, 422, error.message);
        return true;
      }
      if (error instanceof BodyTooLargeError) {
        sendError(res, 413, error.message);
        return true;
      }
      sendError(res, 500, "internal server error");
    }
    return true;
  }

  sendError(res, 405, "method not allowed");
  return true;
}
