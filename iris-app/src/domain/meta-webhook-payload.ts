export const WEBHOOK_PAYLOAD_MAX_BYTES = 2048;

export function truncateWebhookPayload(payloadJson: string): string {
  if (payloadJson.length <= WEBHOOK_PAYLOAD_MAX_BYTES) {
    return payloadJson;
  }

  return `${payloadJson.slice(0, WEBHOOK_PAYLOAD_MAX_BYTES)}…`;
}
