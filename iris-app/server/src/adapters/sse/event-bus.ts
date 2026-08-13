import type { ServerResponse } from "node:http";

export type PostsChangedPayload = {
  post_id?: string;
};

export type CommentsChangedPayload = {
  post_id?: string;
};

export type MessagesChangedPayload = {
  conversation_id?: string;
};

class EventBus {
  private readonly clients = new Set<ServerResponse>();

  subscribe(client: ServerResponse): void {
    this.clients.add(client);
    client.on("close", () => {
      this.unsubscribe(client);
    });
  }

  unsubscribe(client: ServerResponse): void {
    this.clients.delete(client);
  }

  broadcast(event: string, data: unknown): void {
    const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(frame);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  clientCount(): number {
    return this.clients.size;
  }
}

export const eventBus = new EventBus();

export function notifyPostsChanged(payload: PostsChangedPayload = {}): void {
  eventBus.broadcast("posts-changed", payload);
}

export function notifyCommentsChanged(
  payload: CommentsChangedPayload = {},
): void {
  eventBus.broadcast("comments-changed", payload);
}

export function notifyMessagesChanged(
  payload: MessagesChangedPayload = {},
): void {
  eventBus.broadcast("messages-changed", payload);
}
