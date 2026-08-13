import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MetaConversationsReader,
  RemoteConversation,
  RemoteMessage,
} from "../../ports/meta-conversations-reader.ts";

export type GraphApiConversationsReaderConfig = {
  resolveIgUserId: () => string | null;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphApiConversationsReaderDeps = {
  metaTokenStore: MetaTokenStore;
  config: GraphApiConversationsReaderConfig;
};

type GraphConversationsResponse = {
  data?: Array<{ id?: string; updated_time?: string }>;
  error?: { message?: string; code?: number };
};

type GraphMessagesResponse = {
  data?: Array<{
    id?: string;
    message?: string;
    created_time?: string;
    from?: { id?: string; username?: string };
  }>;
  paging?: { cursors?: { after?: string } };
  error?: { message?: string; code?: number };
};

export class MetaConversationsUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaConversationsUnsupportedError";
  }
}

function mapMetaListError(json: { error?: { message?: string; code?: number } }, status: number): Error {
  const message = json.error?.message ?? `Meta API error (${status})`;
  const code = json.error?.code;
  if (code === 10 || code === 200 || code === 100) {
    return new MetaConversationsUnsupportedError(message);
  }
  return new Error(message);
}

export function createGraphApiConversationsReader(
  deps: GraphApiConversationsReaderDeps,
): MetaConversationsReader {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  async function getTokenAndIgUserId(): Promise<{ token: string; igUserId: string }> {
    const token = deps.metaTokenStore.getActiveToken();
    if (!token) {
      throw new Error("Meta access token not configured");
    }

    const igUserId = deps.config.resolveIgUserId();
    if (!igUserId) {
      throw new Error("IG user id not configured");
    }

    return { token, igUserId };
  }

  return {
    async listConversations(limit) {
      const { token, igUserId } = await getTokenAndIgUserId();
      const safeLimit = Math.min(Math.max(limit, 1), 25);
      const url = new URL(`${base}/${igUserId}/conversations`);
      url.searchParams.set("platform", "instagram");
      url.searchParams.set("fields", "id,updated_time");
      url.searchParams.set("limit", String(safeLimit));
      url.searchParams.set("access_token", token);

      const response = await fetchFn(url.toString());
      const json = (await response.json()) as GraphConversationsResponse;

      if (!response.ok || json.error) {
        throw mapMetaListError(json, response.status);
      }

      return (json.data ?? [])
        .filter((row): row is { id: string; updated_time?: string } => Boolean(row.id))
        .map(
          (row): RemoteConversation => ({
            id: row.id,
            updatedTime: row.updated_time ?? null,
          }),
        );
    },

    async listMessages(conversationIgId, limit = 25, after) {
      const { token } = await getTokenAndIgUserId();
      const safeLimit = Math.min(Math.max(limit, 1), 50);
      const url = new URL(`${base}/${conversationIgId}/messages`);
      url.searchParams.set("fields", "id,message,from,created_time");
      url.searchParams.set("limit", String(safeLimit));
      url.searchParams.set("access_token", token);
      if (after) {
        url.searchParams.set("after", after);
      }

      const response = await fetchFn(url.toString());
      const json = (await response.json()) as GraphMessagesResponse;

      if (!response.ok || json.error) {
        throw mapMetaListError(json, response.status);
      }

      const igUserId = deps.config.resolveIgUserId();

      const messages: RemoteMessage[] = (json.data ?? [])
        .filter((row): row is NonNullable<GraphMessagesResponse["data"]>[number] & { id: string } =>
          Boolean(row.id),
        )
        .map((row) => {
          const fromId = row.from?.id ?? null;
          const isFromPage = Boolean(igUserId && fromId === igUserId);
          return {
            id: row.id,
            text: typeof row.message === "string" ? row.message : null,
            fromId,
            fromUsername: row.from?.username ?? null,
            createdTime: row.created_time ?? null,
            direction: isFromPage ? "outbound" : "inbound",
          } satisfies RemoteMessage;
        });

      return {
        messages,
        after: json.paging?.cursors?.after ?? null,
      };
    },
  };
}
