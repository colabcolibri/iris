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
  /**
   * Optional Page-scoped credentials used only to reclaim thread control via
   * the Handover Protocol (graph.facebook.com/{page-id}/take_thread_control).
   * This is a Messenger Platform operation, not part of the Instagram Login
   * messaging API, so it needs a separate Page Access Token — the normal
   * Instagram User token from metaTokenStore cannot call it.
   */
  resolvePageId?: () => string | null;
  resolvePageAccessToken?: () => string | null;
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

const META_THREAD_OWNER_SUBCODE = 2534037;

function mapSendError(json: GraphSendResponse, status: number): Error {
  const message = json.error?.message ?? `Meta API error (${status})`;
  const subcode = json.error?.error_subcode;
  const code = json.error?.code;
  const lower = message.toLowerCase();
  const meta = { metaCode: code, metaSubcode: subcode };

  if (
    subcode === 2534022 ||
    lower.includes("24 hour") ||
    lower.includes("outside of allowed window")
  ) {
    return new MetaMessageWindowExpiredError(message);
  }

  if (subcode === META_THREAD_OWNER_SUBCODE) {
    return new MetaMessageSendError(message, "thread_owner", meta);
  }

  if (code === 10 || code === 200) {
    return new MetaMessageSendError(message, "permission_denied", meta);
  }

  if (lower.includes("rate limit")) {
    return new MetaMessageSendError(message, "rate_limit", meta);
  }

  return new MetaMessageSendError(message, "send_failed", meta);
}

export function createGraphApiMessageSender(
  deps: GraphApiMessageSenderDeps,
): MetaMessageSender {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;
  const facebookBase = `https://graph.facebook.com/${version}`;

  async function takeThreadControl(recipientIgUserId: string): Promise<boolean> {
    const pageId = deps.config.resolvePageId?.();
    const pageToken = deps.config.resolvePageAccessToken?.();
    if (!pageId || !pageToken) {
      return false;
    }

    const url = new URL(`${facebookBase}/${pageId}/take_thread_control`);
    try {
      const response = await fetchFn(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pageToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientIgUserId },
        }),
      });
      const json = (await response.json()) as GraphSendResponse;
      if (!response.ok || json.error) {
        console.warn(
          `[meta] take_thread_control failed for recipient ${recipientIgUserId}: ` +
            `${json.error?.message ?? `HTTP ${response.status}`} ` +
            `(code=${json.error?.code ?? "?"}, subcode=${json.error?.error_subcode ?? "?"})`,
        );
        return false;
      }
      return true;
    } catch (error) {
      console.warn(
        `[meta] take_thread_control request errored for recipient ${recipientIgUserId}:`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }

  async function postMessage(
    recipientIgUserId: string,
    text: string,
    token: string,
    replyToMid?: string | null,
  ): Promise<{ publishedIgMessageId: string | null }> {
    const url = new URL(`${base}/me/messages`);
    const payload: Record<string, unknown> = {
      recipient: { id: recipientIgUserId },
      message: { text },
    };
    if (replyToMid) {
      payload.reply_to = { mid: replyToMid };
    }

    const response = await fetchFn(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as GraphSendResponse;

    if (!response.ok || json.error) {
      throw mapSendError(json, response.status);
    }

    return { publishedIgMessageId: json.message_id ?? null };
  }

  return {
    async sendText(recipientIgUserId, text, options = {}) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const replyToMid = options.replyToMid ?? null;

      try {
        return await postMessage(recipientIgUserId, text, token, replyToMid);
      } catch (error) {
        if (
          error instanceof MetaMessageSendError &&
          error.code === "thread_owner" &&
          (await takeThreadControl(recipientIgUserId))
        ) {
          return await postMessage(recipientIgUserId, text, token, replyToMid);
        }
        throw error;
      }
    },
  };
}
