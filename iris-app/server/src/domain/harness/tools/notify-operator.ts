import type { HarnessTool } from "../../ports/harness-tool.ts";
import type { OperatorNotificationUrgency } from "../notifications/operator-notification-types.ts";
import { serializeOperatorNotificationLogEntry } from "../../notifications/serialize-operator-notification-log.ts";

function normalizeUrgency(value: unknown): OperatorNotificationUrgency {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

export function createNotifyOperatorTool(): HarnessTool {
  return {
    name: "notify_operator",
    description:
      "Escalate to a human operator. Requires reason, customerSummary, and customerMessage (all in the configured response language). Optional urgency: low | medium | high.",
    async execute(ctx, args) {
      const reason = typeof args.reason === "string" ? args.reason.trim() : "";
      const customerSummary =
        typeof args.customerSummary === "string" ? args.customerSummary.trim() : "";
      const customerMessage =
        typeof args.customerMessage === "string" ? args.customerMessage.trim() : "";
      const suggestedNextStep =
        typeof args.suggestedNextStep === "string"
          ? args.suggestedNextStep.trim()
          : null;
      const urgency = normalizeUrgency(args.urgency);

      if (!reason || !customerSummary || !customerMessage) {
        return {
          success: false,
          output: { error: "missing_required_fields" },
          errorCode: "missing_required_fields",
        };
      }

      if (!ctx.operatorNotification) {
        return {
          success: false,
          output: { error: "operator_notification_unavailable" },
          errorCode: "operator_notification_unavailable",
        };
      }

      const { service, context: notificationContext } = ctx.operatorNotification;
      const notifications = await service.notify({
        type: "operator_attention_required",
        urgency,
        reason: reason.slice(0, 500),
        customerSummary: customerSummary.slice(0, 500),
        suggestedNextStep,
        conversationId: notificationContext.conversationId ?? null,
        participantUsername: notificationContext.participantUsername ?? null,
        participantDisplayName: notificationContext.participantDisplayName ?? null,
        supportIntent: notificationContext.supportIntent ?? null,
        adminDeepLink: notificationContext.adminDeepLink ?? null,
        inboundMessageText: notificationContext.inboundMessageText ?? null,
        messageTimestamp: notificationContext.inboundMessageTimestamp ?? null,
      });

      return {
        success: true,
        output: {
          escalated: true,
          text: customerMessage,
          urgency,
          notifications: notifications.map(serializeOperatorNotificationLogEntry),
        },
      };
    },
  };
}
