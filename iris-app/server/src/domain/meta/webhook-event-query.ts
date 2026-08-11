import type {
  WebhookEventListFilter,
  WebhookProcessingStatus,
} from "../../ports/webhook-event-repository.ts";

const WEBHOOK_STATUSES = new Set<WebhookProcessingStatus>([
  "received",
  "processed",
  "ignored",
  "failed",
]);

export function parseWebhookEventListFilter(
  searchParams: URLSearchParams,
): WebhookEventListFilter {
  const filter: WebhookEventListFilter = {};

  const status = searchParams.get("status");
  if (status && WEBHOOK_STATUSES.has(status as WebhookProcessingStatus)) {
    filter.status = status as WebhookProcessingStatus;
  }

  const field = searchParams.get("field")?.trim();
  if (field) {
    filter.field = field;
  }

  const signatureValid = searchParams.get("signature_valid");
  if (signatureValid === "0" || signatureValid === "false") {
    filter.signatureValid = false;
  } else if (signatureValid === "1" || signatureValid === "true") {
    filter.signatureValid = true;
  }

  return filter;
}
