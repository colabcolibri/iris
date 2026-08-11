export type WebhookProcessingStatus = "received" | "processed" | "ignored" | "failed";

export type InsertWebhookEventInput = {
  object?: string | null;
  field?: string | null;
  payloadJson: string;
  signatureValid: boolean;
  processingStatus?: WebhookProcessingStatus;
  errorMessage?: string | null;
};

export type UpdateWebhookEventInput = {
  processingStatus?: WebhookProcessingStatus;
  object?: string | null;
  field?: string | null;
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

export type WebhookEventListFilter = {
  status?: WebhookProcessingStatus;
  field?: string;
  signatureValid?: boolean;
};

export type WebhookEventRepository = {
  insert(input: InsertWebhookEventInput): WebhookEventRecord;
  update(id: string, input: UpdateWebhookEventInput): WebhookEventRecord | null;
  listRecent(limit: number, filter?: WebhookEventListFilter): WebhookEventRecord[];
  listForExport(limit: number, filter?: WebhookEventListFilter): WebhookEventRecord[];
  count(): number;
  deleteOlderThan(cutoffIso: string): number;
};
