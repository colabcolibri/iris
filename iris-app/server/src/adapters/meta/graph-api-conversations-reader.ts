import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import { ErrorCodes } from "../../domain/errors/error-codes.ts";
import { isConversationOwnerParticipant } from "../../domain/messages/remote-message-utils.ts";
import type {
  MetaConversationsReader,
  RemoteConversationParticipant,
  RemoteMessage,
  RemoteMessageAttachment,
} from "../../ports/meta-conversations-reader.ts";

export type GraphApiConversationsReaderConfig = {
  resolveIgUserId: () => string | null;
  resolveOwnerUsername?: () => string | null;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphApiConversationsReaderDeps = {
  metaTokenStore: MetaTokenStore;
  config: GraphApiConversationsReaderConfig;
};

type GraphConversationsResponse = {
  data?: Array<{
    id?: string;
    updated_time?: string;
    participants?: {
      data?: Array<{
        id?: string;
        username?: string;
        name?: string;
      }>;
    };
    messages?: GraphMessagesResponse;
  }>;
  error?: { message?: string; code?: number };
};

type GraphMessagesResponse = {
  data?: Array<{
    id?: string;
    message?: string;
    created_time?: string;
    from?: { id?: string; username?: string; name?: string };
    attachments?: {
      data?: Array<{
        file_url?: string;
        image_data?: { url?: string };
        video_data?: { url?: string };
      }>;
    };
  }>;
  paging?: { cursors?: { after?: string } };
  error?: { message?: string; code?: number };
};

type GraphProfileResponse = {
  id?: string;
  username?: string;
  name?: string;
  profile_pic?: string;
  error?: { message?: string; code?: number };
};

type GraphMessageDetailResponse = {
  from?: { id?: string; username?: string };
  to?: { data?: Array<{ id?: string; username?: string }> };
  error?: { message?: string; code?: number };
};

function readCustomerIdFromMessageDetail(
  json: GraphMessageDetailResponse,
  ownerIgUserId: string | null,
  ownerUsername: string | null,
): string | null {
  const fromId = json.from?.id ?? null;
  const fromUsername = json.from?.username ?? null;
  if (
    fromId &&
    !isConversationOwnerParticipant(
      { id: fromId, username: fromUsername, name: null, profilePicUrl: null },
      ownerIgUserId,
      ownerUsername,
    )
  ) {
    return fromId;
  }

  for (const row of json.to?.data ?? []) {
    const id = row?.id ?? null;
    const username = row?.username ?? null;
    if (
      id &&
      !isConversationOwnerParticipant(
        { id, username, name: null, profilePicUrl: null },
        ownerIgUserId,
        ownerUsername,
      )
    ) {
      return id;
    }
  }

  return null;
}

export class MetaConversationsUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaConversationsUnsupportedError";
  }
}

export class MetaConversationsRateLimitError extends Error {
  readonly code = ErrorCodes.RATE_LIMITED;

  constructor() {
    super(ErrorCodes.RATE_LIMITED);
    this.name = "MetaConversationsRateLimitError";
  }
}

function mapMetaListError(json: { error?: { message?: string; code?: number } }, status: number): Error {
  const message = json.error?.message ?? `Meta API error (${status})`;
  const code = json.error?.code;
  const lower = message.toLowerCase();
  if (
    code === 4 ||
    code === 17 ||
    code === 32 ||
    code === 613 ||
    status === 429 ||
    lower.includes("request limit") ||
    lower.includes("rate limit")
  ) {
    return new MetaConversationsRateLimitError();
  }
  if (code === 10 || code === 200 || code === 100) {
    return new MetaConversationsUnsupportedError(message);
  }
  return new Error(message);
}

function mapParticipants(row: {
  participants?: {
    data?: Array<{
      id?: string;
      username?: string;
      name?: string;
    }>;
  };
}): RemoteConversationParticipant[] {
  const rows = row.participants?.data ?? [];
  return rows
    .filter((row): row is { id: string; username?: string; name?: string } => Boolean(row?.id))
    .map((row) => ({
      id: row.id,
      username: typeof row.username === "string" ? row.username : null,
      name: typeof row.name === "string" ? row.name : null,
      profilePicUrl: null,
    }));
}

function parseMessageAttachments(row: {
  attachments?: {
    data?: Array<{
      file_url?: string;
      image_data?: { url?: string };
      video_data?: { url?: string };
    }>;
  };
}): RemoteMessageAttachment[] {
  const rows = row.attachments?.data ?? [];
  const parsed: RemoteMessageAttachment[] = [];

  for (const attachment of rows) {
    const imageUrl =
      attachment?.image_data && typeof attachment.image_data.url === "string"
        ? attachment.image_data.url
        : null;
    const videoUrl =
      attachment?.video_data && typeof attachment.video_data.url === "string"
        ? attachment.video_data.url
        : null;
    const fileUrl = typeof attachment?.file_url === "string" ? attachment.file_url : null;

    if (imageUrl) {
      parsed.push({ url: imageUrl, mediaType: "image" });
      continue;
    }
    if (videoUrl) {
      parsed.push({ url: videoUrl, mediaType: "video" });
      continue;
    }
    if (fileUrl) {
      parsed.push({ url: fileUrl, mediaType: "file" });
    }
  }

  return parsed;
}

function mapGraphMessageRow(
  row: NonNullable<GraphMessagesResponse["data"]>[number] & { id: string },
  igUserId: string | null,
  ownerUsername: string | null,
): RemoteMessage {
  const fromId = row.from?.id ?? null;
  const fromUsername = row.from?.username ?? null;
  const isFromPage =
    Boolean(igUserId && fromId === igUserId) ||
    Boolean(
      ownerUsername &&
        fromUsername &&
        fromUsername.replace(/^@+/, "").toLowerCase() ===
          ownerUsername.replace(/^@+/, "").toLowerCase(),
    );
  const attachments = parseMessageAttachments(row);
  return {
    id: row.id,
    text: typeof row.message === "string" ? row.message : null,
    fromId,
    fromUsername,
    fromDisplayName: row.from?.name ?? null,
    createdTime: row.created_time ?? null,
    direction: isFromPage ? "outbound" : "inbound",
    attachments,
  };
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
    async listConversations(limit, options = {}) {
      const { token, igUserId } = await getTokenAndIgUserId();
      const safeLimit = Math.min(Math.max(limit, 1), 25);
      const url = new URL(`${base}/${igUserId}/conversations`);
      url.searchParams.set("platform", "instagram");
      url.searchParams.set(
        "fields",
        options.includeRecentMessages
          ? "id,updated_time,participants,messages.limit(20){id,message,from,created_time,attachments{image_data,video_data,file_url}}"
          : "id,updated_time,participants",
      );
      url.searchParams.set("limit", String(safeLimit));
      url.searchParams.set("access_token", token);

      const response = await fetchFn(url.toString());
      const json = (await response.json()) as GraphConversationsResponse;

      if (!response.ok || json.error) {
        throw mapMetaListError(json, response.status);
      }

      const ownerUsername = deps.config.resolveOwnerUsername?.() ?? null;

      return (json.data ?? [])
        .filter((row): row is NonNullable<GraphConversationsResponse["data"]>[number] & { id: string } =>
          Boolean(row.id),
        )
        .map((row) => ({
          id: row.id,
          updatedTime: row.updated_time ?? null,
          participants: mapParticipants(row),
          recentMessages: (row.messages?.data ?? [])
            .filter((message): message is NonNullable<GraphMessagesResponse["data"]>[number] & { id: string } =>
              Boolean(message?.id),
            )
            .map((message) => mapGraphMessageRow(message, igUserId, ownerUsername)),
        }));
    },

    async listMessages(conversationIgId, limit = 25, after) {
      const { token, igUserId } = await getTokenAndIgUserId();
      const safeLimit = Math.min(Math.max(limit, 1), 50);
      const url = new URL(`${base}/${conversationIgId}/messages`);
      url.searchParams.set(
        "fields",
        "id,message,from,created_time,attachments{image_data,video_data,file_url}",
      );
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

      const ownerUsername = deps.config.resolveOwnerUsername?.() ?? null;

      const messages = (json.data ?? [])
        .filter((row): row is NonNullable<GraphMessagesResponse["data"]>[number] & { id: string } =>
          Boolean(row.id),
        )
        .map((row) => mapGraphMessageRow(row, igUserId, ownerUsername));

      return {
        messages,
        after: json.paging?.cursors?.after ?? null,
      };
    },

    async resolveParticipantProfile(participantIgUserId) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token || !participantIgUserId) {
        return null;
      }

      const url = new URL(`${base}/${participantIgUserId}`);
      url.searchParams.set("fields", "id,username,name,profile_pic");
      url.searchParams.set("access_token", token);

      const response = await fetchFn(url.toString());
      const json = (await response.json()) as GraphProfileResponse;
      if (!response.ok || json.error) {
        return null;
      }

      return {
        username: typeof json.username === "string" ? json.username : null,
        name: typeof json.name === "string" ? json.name : null,
        profilePicUrl: typeof json.profile_pic === "string" ? json.profile_pic : null,
      };
    },

    async resolveMessagingRecipientFromIgMessage(
      igMessageId,
      ownerIgUserId,
      ownerUsername,
    ) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token || !igMessageId) {
        return null;
      }

      const url = new URL(`${base}/${igMessageId}`);
      url.searchParams.set("fields", "from,to");

      const response = await fetchFn(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await response.json()) as GraphMessageDetailResponse;
      if (!response.ok || json.error) {
        return null;
      }

      return readCustomerIdFromMessageDetail(json, ownerIgUserId, ownerUsername);
    },
  };
}
