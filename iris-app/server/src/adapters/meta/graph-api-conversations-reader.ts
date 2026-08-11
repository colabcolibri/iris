import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MetaConversationsReader,
  RemoteConversation,
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

export class MetaConversationsUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaConversationsUnsupportedError";
  }
}

export function createGraphApiConversationsReader(
  deps: GraphApiConversationsReaderDeps,
): MetaConversationsReader {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  return {
    async listConversations(limit) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const igUserId = deps.config.resolveIgUserId();
      if (!igUserId) {
        throw new Error("IG user id not configured");
      }

      const safeLimit = Math.min(Math.max(limit, 1), 25);
      const url = new URL(`${base}/${igUserId}/conversations`);
      url.searchParams.set("platform", "instagram");
      url.searchParams.set("fields", "id,updated_time");
      url.searchParams.set("limit", String(safeLimit));
      url.searchParams.set("access_token", token);

      const response = await fetchFn(url.toString());
      const json = (await response.json()) as GraphConversationsResponse;

      if (!response.ok || json.error) {
        const message = json.error?.message ?? `Meta API error (${response.status})`;
        const code = json.error?.code;
        if (code === 10 || code === 200 || code === 100) {
          throw new MetaConversationsUnsupportedError(message);
        }
        throw new Error(message);
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
  };
}
