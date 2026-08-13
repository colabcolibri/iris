export type RemoteConversation = {
  id: string;
  updatedTime: string | null;
};

export type RemoteMessage = {
  id: string;
  text: string | null;
  fromId: string | null;
  fromUsername: string | null;
  createdTime: string | null;
  direction: "inbound" | "outbound";
};

export type RemoteMessagesPage = {
  messages: RemoteMessage[];
  after: string | null;
};

export type MetaConversationsReader = {
  listConversations(limit: number): Promise<RemoteConversation[]>;
  listMessages(
    conversationIgId: string,
    limit?: number,
    after?: string,
  ): Promise<RemoteMessagesPage>;
};
