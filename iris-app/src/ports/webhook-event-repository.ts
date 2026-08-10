export type WebhookProcessingStatus = "received" | "processed" | "ignored" | "failed";

export type InsertWebhookEventInput = {
  object: string | null;
  field: string | null;
  payloadJson: string;
};

export type UpdateWebhookEventInput = {
  processingStatus: WebhookProcessingStatus;
  commentId?: string | null;
  postId?: string | null;
  errorMessage?: string | null;
};

export type WebhookEventRecord = {
  id: string;
  receivedAt: string;
  signatureValid: boolean;
  object: string | null;
  field: string | null;
  payloadJson: string;
  processingStatus: WebhookProcessingStatus;
  commentId: string | null;
  postId: string | null;
  errorMessage: string | null;
};

export type WebhookEventRepository = {
  insert(input: InsertWebhookEventInput): WebhookEventRecord;
  update(id: string, input: UpdateWebhookEventInput): WebhookEventRecord | null;
  listRecent(limit: number): WebhookEventRecord[];
  count(): number;
};
