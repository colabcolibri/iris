import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { composeRouters, createAdminPathRouter, createRouter, route } from "../router.ts";
import {
  DEFAULT_API_URL,
  DEFAULT_MODEL,
} from "../../adapters/sqlite/llm-settings-repository.ts";
import {
  createLlmConfigResolver,
  llmKeyHint,
} from "../../domain/llm/resolve-llm-config.ts";
import { truncateWebhookPayload } from "../../domain/meta-webhook-payload.ts";
import { summarizeWebhookPayload } from "../../domain/webhook-event-summary.ts";
import { parseWebhookEventListFilter } from "../../domain/webhook-event-query.ts";
import type { WebhookEventRecord } from "../../ports/webhook-event-repository.ts";
import type { AppContext } from "../app-context.ts";

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

function serializeWebhookEvent(
  event: WebhookEventRecord,
  options: { truncatePayload: boolean },
) {
  const summary = summarizeWebhookPayload(event.payloadJson, event.object, event.field);
  const payloadJson = options.truncatePayload
    ? truncateWebhookPayload(event.payloadJson)
    : event.payloadJson;

  return {
    id: event.id,
    received_at: event.receivedAt,
    signature_valid: event.signatureValid,
    object: event.object,
    field: event.field,
    processing_status: event.processingStatus,
    comment_id: event.commentId,
    post_id: event.postId,
    error_message: event.errorMessage,
    payload_json: payloadJson,
    payload_truncated: options.truncatePayload && event.payloadJson.length > 2048,
    ...summary,
  };
}

export const handleLlmSettingsRoute = createAdminPathRouter("/api/settings/llm", {
  GET: async (match) => {
    sendJson(match.res, 200, serializeLlmSettings(match.ctx));
  },
  PUT: async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const existing = match.ctx.llmSettingsStore.get();
    const input = normalizeLlmBody(body, existing?.apiKey ?? null);
    match.ctx.llmSettingsStore.upsert(input);
    sendJson(match.res, 200, serializeLlmSettings(match.ctx));
  },
});

const webhookEventsListRouter = createRouter([
  route("GET", "/api/settings/webhook-events", { admin: true }, async (match) => {
    const limitRaw = Number(match.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
    const filter = parseWebhookEventListFilter(match.searchParams);

    const events = match.ctx.webhookEvents.listRecent(limit, filter).map((event) =>
      serializeWebhookEvent(event, { truncatePayload: true }),
    );

    sendJson(match.res, 200, { events });
  }),
]);

const webhookEventsExportRouter = createRouter([
  route("GET", "/api/settings/webhook-events/export", { admin: true }, async (match) => {
    const limitParam = match.searchParams.get("limit");
    if (!limitParam) {
      sendError(match.res, 422, "limit query parameter is required");
      return;
    }

    const limitRaw = Number(limitParam);
    if (!Number.isFinite(limitRaw) || limitRaw < 1) {
      sendError(match.res, 422, "limit must be a positive number");
      return;
    }

    const limit = Math.min(Math.trunc(limitRaw), 10_000);
    const filter = parseWebhookEventListFilter(match.searchParams);
    const events = match.ctx.webhookEvents.listForExport(limit, filter).map((event) =>
      serializeWebhookEvent(event, { truncatePayload: false }),
    );

    const exportedAt = new Date().toISOString();
    const filename = `iris-webhooks-${exportedAt.slice(0, 10)}.json`;
    match.res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    match.res.end(
      JSON.stringify(
        {
          exported_at: exportedAt,
          total: events.length,
          events,
        },
        null,
        2,
      ),
    );
  }),
]);

export const handleWebhookEventsSettingsRoute = composeRouters([
  webhookEventsExportRouter,
  webhookEventsListRouter,
]);
