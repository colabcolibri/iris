import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type { MetaMessageSender } from "../../ports/meta-message-sender.ts";
import {
  MetaMessageSendError,
  MetaMessageWindowExpiredError,
} from "../../ports/meta-message-sender.ts";

export type GraphApiMessageSenderConfig = {
  resolveIgUserId: () => string | null;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphApiMessageSenderDeps = {
  metaTokenStore: MetaTokenStore;
  config: GraphApiMessageSenderConfig;
};

type GraphSendResponse = {
  message_id?: string;
  recipient_id?: string;
  error?: { message?: string; code?: number; error_subcode?: number };
};

function mapSendError(json: GraphSendResponse, status: number): Error {
  const message = json.error?.message ?? `Meta API error (${status})`;
  const subcode = json.error?.error_subcode;
  const code = json.error?.code;
  const lower = message.toLowerCase();

  if (
    subcode === 2534022 ||
    lower.includes("24 hour") ||
    lower.includes("outside of allowed window")
  ) {
    return new MetaMessageWindowExpiredError(message);
  }

  if (code === 10 || code === 200) {
    return new MetaMessageSendError(message, "permission_denied");
  }

  if (lower.includes("rate limit")) {
    return new MetaMessageSendError(message, "rate_limit");
  }

  return new MetaMessageSendError(message, "send_failed");
}

export function createGraphApiMessageSender(
  deps: GraphApiMessageSenderDeps,
): MetaMessageSender {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  return {
    async sendText(recipientIgUserId, text) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const igUserId = deps.config.resolveIgUserId();
      if (!igUserId) {
        throw new Error("IG user id not configured");
      }

      const url = new URL(`${base}/${igUserId}/messages`);

      const response = await fetchFn(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientIgUserId },
          message: { text },
        }),
      });

      const json = (await response.json()) as GraphSendResponse;

      if (!response.ok || json.error) {
        throw mapSendError(json, response.status);
      }

      return { publishedIgMessageId: json.message_id ?? null };
    },
  };
}
