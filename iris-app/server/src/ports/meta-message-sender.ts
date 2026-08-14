export type MetaSendTextOptions = {
  replyToMid?: string | null;
};

export type MetaMessageSender = {
  sendText(
    recipientIgUserId: string,
    text: string,
    options?: MetaSendTextOptions,
  ): Promise<{ publishedIgMessageId: string | null }>;
};

export class MetaMessageSendError extends Error {
  readonly code: string;
  readonly metaCode?: number;
  readonly metaSubcode?: number;

  constructor(
    message: string,
    code: string,
    meta?: { metaCode?: number; metaSubcode?: number },
  ) {
    super(message);
    this.name = "MetaMessageSendError";
    this.code = code;
    this.metaCode = meta?.metaCode;
    this.metaSubcode = meta?.metaSubcode;
  }
}

export class MetaMessageWindowExpiredError extends MetaMessageSendError {
  constructor(message: string) {
    super(message, "window_expired");
    this.name = "MetaMessageWindowExpiredError";
  }
}
