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
import { defaultReplyPersona } from "../../domain/reply-persona-defaults.ts";
import type { ReplyPersona } from "../../ports/reply-persona-store.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

function serializePersona(persona: ReplyPersona) {
  return {
    system_prompt: persona.systemPrompt,
    tone: persona.tone,
    brand_name: persona.brandName,
    max_chars: persona.maxChars,
    updated_at: persona.updatedAt,
  };
}

function normalizePersonaBody(body: Record<string, unknown>): Omit<ReplyPersona, "updatedAt"> {
  const systemPrompt =
    typeof body.system_prompt === "string" ? body.system_prompt.trim() : "";
  const tone = typeof body.tone === "string" ? body.tone.trim() : "";

  if (!systemPrompt) {
    throw new ValidationError("system_prompt is required");
  }
  if (!tone) {
    throw new ValidationError("tone is required");
  }

  const maxCharsRaw = body.max_chars;
  const maxChars =
    typeof maxCharsRaw === "number"
      ? maxCharsRaw
      : typeof maxCharsRaw === "string"
        ? Number(maxCharsRaw)
        : NaN;

  if (!Number.isInteger(maxChars) || maxChars < 100 || maxChars > 1000) {
    throw new ValidationError("max_chars must be an integer between 100 and 1000");
  }

  const brandName =
    body.brand_name === null
      ? null
      : typeof body.brand_name === "string"
        ? body.brand_name.trim() || null
        : undefined;

  if (brandName === undefined) {
    throw new ValidationError("brand_name must be a string or null");
  }

  return {
    systemPrompt,
    tone,
    brandName,
    maxChars,
  };
}

export async function handleSettingsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/settings/reply-persona") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method === "GET") {
    const persona = ctx.replyPersonaStore.get() ?? defaultReplyPersona();
    sendJson(res, 200, serializePersona(persona));
    return true;
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req);
      const input = normalizePersonaBody(body);
      const saved = ctx.replyPersonaStore.upsert(input);
      sendJson(res, 200, serializePersona(saved));
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
