export type RemoteConversation = {
  id: string;
  updatedTime: string | null;
  participants: RemoteConversationParticipant[];
  recentMessages: RemoteMessage[];
};

export type ListConversationsOptions = {
  includeRecentMessages?: boolean;
};

export type RemoteConversationParticipant = {
  id: string;
  username: string | null;
  name: string | null;
  profilePicUrl: string | null;
};

export type RemoteMessageAttachment = {
  url: string;
  mediaType: "image" | "video" | "file";
};

export type RemoteMessage = {
  id: string;
  text: string | null;
  fromId: string | null;
  fromUsername: string | null;
  fromDisplayName: string | null;
  createdTime: string | null;
  direction: "inbound" | "outbound";
  attachments: RemoteMessageAttachment[];
};

export type RemoteMessagesPage = {
  messages: RemoteMessage[];
  after: string | null;
};

export type RemoteParticipantProfile = {
  username: string | null;
  name: string | null;
  profilePicUrl: string | null;
};

export type MetaConversationsReader = {
  listConversations(
    limit: number,
    options?: ListConversationsOptions,
  ): Promise<RemoteConversation[]>;
  listMessages(
    conversationIgId: string,
    limit?: number,
    after?: string,
  ): Promise<RemoteMessagesPage>;
  resolveParticipantProfile(
    participantIgUserId: string,
  ): Promise<RemoteParticipantProfile | null>;
  /** IGSID do cliente a partir de uma mensagem inbound (webhook mid / Graph message id). */
  resolveMessagingRecipientFromIgMessage(
    igMessageId: string,
    ownerIgUserId: string | null,
    ownerUsername: string | null,
  ): Promise<string | null>;
};
