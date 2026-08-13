export type MetaMessageSender = {
  sendText(recipientIgUserId: string, text: string): Promise<{ publishedIgMessageId: string | null }>;
};

export class MetaMessageSendError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "MetaMessageSendError";
    this.code = code;
  }
}

export class MetaMessageWindowExpiredError extends MetaMessageSendError {
  constructor(message: string) {
    super(message, "window_expired");
    this.name = "MetaMessageWindowExpiredError";
  }
}
