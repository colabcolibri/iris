import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { truncateWebhookPayload } from "../../domain/meta/meta-webhook-payload.ts";
import { summarizeWebhookPayload } from "../../domain/meta/webhook-event-summary.ts";
import type { WebhookProcessingStatus } from "../../ports/webhook-event-repository.ts";
import { jsonToolContent } from "../tool-response.ts";

const WEBHOOK_STATUSES = ["received", "processed", "ignored", "failed"] as const;

export function registerWebhookTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_webhooks",
    "List recent Meta webhook events stored by Iris",
    {
      limit: z.number().int().min(1).max(100).optional(),
      status: z.enum(WEBHOOK_STATUSES).optional(),
      field: z.string().optional(),
      signatureValid: z.boolean().optional(),
    },
    async (args) => {
      const limit = args.limit ?? 50;
      const events = ctx.webhookEvents.listRecent(limit, {
        status: args.status as WebhookProcessingStatus | undefined,
        field: args.field,
        signatureValid: args.signatureValid,
      });

      return jsonToolContent({
        events: events.map((event) => {
          const summary = summarizeWebhookPayload(
            event.payloadJson,
            event.object,
            event.field,
          );
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
            payload_json: truncateWebhookPayload(event.payloadJson),
            payload_truncated: event.payloadJson.length > 2048,
            ...summary,
          };
        }),
      });
    },
  );
}
