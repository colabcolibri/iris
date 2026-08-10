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
import {
  DEFAULT_API_URL,
  DEFAULT_MODEL,
} from "../../adapters/sqlite/llm-settings-repository.ts";
import {
  createLlmConfigResolver,
  llmKeyHint,
} from "../../domain/llm/resolve-llm-config.ts";
import { truncateWebhookPayload } from "./meta-webhook.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

function serializeLlmSettings(ctx: AppContext) {
  const resolver = createLlmConfigResolver(ctx.llmSettingsStore);
  const resolved = resolver.resolve();
  const sources = resolver.configuredSources();
  const stored = ctx.llmSettingsStore.get();

  return {
    configured: Boolean(resolved),
    api_url: stored?.apiUrl ?? resolved?.apiUrl ?? DEFAULT_API_URL,
    model: stored?.model ?? resolved?.model ?? DEFAULT_MODEL,
    supports_vision: stored?.supportsVision ?? resolved?.supportsVision ?? false,
    key_hint: llmKeyHint(resolved?.apiKey),
    source: resolved?.source ?? null,
    env_override: sources.environment,
    updated_at: stored?.updatedAt ?? null,
  };
}

function normalizeLlmBody(
  body: Record<string, unknown>,
  existingKey: string | null,
): {
  apiKey?: string;
  apiUrl: string;
  model: string;
  supportsVision: boolean;
} {
  const apiUrlRaw = body.api_url;
  const apiUrl =
    typeof apiUrlRaw === "string" && apiUrlRaw.trim()
      ? apiUrlRaw.trim()
      : DEFAULT_API_URL;

  const modelRaw = body.model;
  const model =
    typeof modelRaw === "string" && modelRaw.trim() ? modelRaw.trim() : DEFAULT_MODEL;

  const supportsVision = body.supports_vision === true || body.supports_vision === 1;

  const apiKeyRaw = body.api_key;
  if (apiKeyRaw === undefined) {
    if (!existingKey) {
      throw new ValidationError("api_key is required on first setup");
    }

    return { apiUrl, model, supportsVision };
  }

  if (apiKeyRaw === null || apiKeyRaw === "") {
    throw new ValidationError("api_key cannot be empty — omit to keep current key");
  }

  if (typeof apiKeyRaw !== "string" || !apiKeyRaw.trim()) {
    throw new ValidationError("api_key must be a non-empty string");
  }

  return {
    apiKey: apiKeyRaw.trim(),
    apiUrl,
    model,
    supportsVision,
  };
}

export async function handleLlmSettingsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/settings/llm") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method === "GET") {
    sendJson(res, 200, serializeLlmSettings(ctx));
    return true;
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody<Record<string, unknown>>(req);
      const existing = ctx.llmSettingsStore.get();
      const input = normalizeLlmBody(body, existing?.apiKey ?? null);
      ctx.llmSettingsStore.upsert(input);
      sendJson(res, 200, serializeLlmSettings(ctx));
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

export async function handleWebhookEventsSettingsRoute(
  request: RouteRequest,
): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/api/settings/webhook-events") {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method !== "GET") {
    sendError(res, 405, "method not allowed");
    return true;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const limitRaw = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  const events = ctx.webhookEvents.listRecent(limit).map((event) => ({
    id: event.id,
    received_at: event.receivedAt,
    signature_valid: event.signatureValid,
    object: event.object,
    field: event.field,
    processing_status: event.processingStatus,
    comment_id: event.commentId,
    post_id: event.postId,
    error_message: event.errorMessage,
    payload_json: truncateWebhookPayload(event.payloadJson),
    payload_truncated: event.payloadJson.length > 2048,
  }));

  sendJson(res, 200, { events });
  return true;
}
