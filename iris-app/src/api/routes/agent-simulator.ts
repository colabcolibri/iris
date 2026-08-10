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
import { simulateReply } from "../../domain/agent-simulator/simulate-reply.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export async function handleAgentSimulatorRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/agent/simulate" || req.method !== "POST") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  try {
    const body = await readJsonBody<Record<string, unknown>>(req);
    const result = await simulateReply(
      {
        caption: typeof body.caption === "string" ? body.caption : null,
        carousel_summary:
          typeof body.carousel_summary === "string" ? body.carousel_summary : null,
        response_language:
          typeof body.response_language === "string" ? body.response_language : undefined,
        brand_name:
          body.brand_name === null
            ? null
            : typeof body.brand_name === "string"
              ? body.brand_name
              : undefined,
        max_chars: typeof body.max_chars === "number" ? body.max_chars : undefined,
        thread: Array.isArray(body.thread)
          ? body.thread.map((entry) => {
              const row = entry as Record<string, unknown>;
              return {
                author: typeof row.author === "string" ? row.author : "user",
                text: typeof row.text === "string" ? row.text : "",
                is_brand_reply: row.is_brand_reply === true,
                at: typeof row.at === "string" ? row.at : undefined,
              };
            })
          : undefined,
        target_comment: {
          author:
            typeof (body.target_comment as Record<string, unknown> | undefined)?.author ===
            "string"
              ? ((body.target_comment as Record<string, unknown>).author as string)
              : "user",
          text:
            typeof (body.target_comment as Record<string, unknown> | undefined)?.text === "string"
              ? ((body.target_comment as Record<string, unknown>).text as string)
              : "",
        },
      },
      {
        personaStore: ctx.replyPersonaStore,
        agentContentStore: ctx.agentContentStore,
        llm: ctx.resolveLlmCompleter(),
      },
    );

    sendJson(res, 200, result);
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
