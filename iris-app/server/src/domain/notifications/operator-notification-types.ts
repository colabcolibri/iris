export type OperatorNotificationEventType = "operator_attention_required";

export type OperatorNotificationChannelId = "email";

export type OperatorNotificationUrgency = "low" | "medium" | "high";

export type OperatorNotificationEvent = {
  type: OperatorNotificationEventType;
  urgency: OperatorNotificationUrgency;
  reason: string;
  customerSummary: string;
  suggestedNextStep?: string | null;
  conversationId?: string | null;
  participantUsername?: string | null;
  participantDisplayName?: string | null;
  supportIntent?: string | null;
  adminDeepLink?: string | null;
  inboundMessageText?: string | null;
  messageTimestamp?: string | null;
};

export type OperatorNotificationChannelConfig = {
  enabled: boolean;
  destination: string;
};

export type OperatorNotificationSettings = {
  channels: {
    email: OperatorNotificationChannelConfig;
  };
  aiLockDays: number;
  updatedAt: string;
};

export type OperatorNotificationLogStatus = "sent" | "skipped" | "failed";

export type OperatorNotificationLogEntry = {
  id: string;
  eventType: OperatorNotificationEventType;
  channel: OperatorNotificationChannelId;
  status: OperatorNotificationLogStatus;
  payloadSummary: string;
  recipient: string | null;
  errorMessage: string | null;
  createdAt: string;
};
