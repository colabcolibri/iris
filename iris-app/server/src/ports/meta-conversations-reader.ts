export type RemoteConversation = {
  id: string;
  updatedTime: string | null;
};

export type MetaConversationsReader = {
  listConversations(limit: number): Promise<RemoteConversation[]>;
};
