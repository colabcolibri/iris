import type { WebhooksMessages } from "./types";

export const webhooksEn = {
  page: {
    eyebrow: "Operations",
    title: "Webhooks",
    description:
      "Events received from Meta in real time. Use to verify whether comments were processed, ignored, or failed.",
    backToAll: "All events",
    list: "List",
    sheetTitle: "Events",
    loading: "Loading events…",
    loadingEvent: "Loading event…",
    loadingShort: "Loading…",
    eventNotFound:
      "Event not found in the current list (filters may be hiding it).",
  },
  filters: {
    statusLabel: "Status",
    typeLabel: "Type",
    all: "all",
    commentsOnly: "comments",
    invalidSignatureOnly: "invalid signature only",
    exportLast: "Export last",
    exportJson: "Export JSON",
    refresh: "Refresh",
  },
  status: {
    received: "received",
    processed: "processed",
    ignored: "ignored",
    failed: "failed",
    invalidSignature: "invalid signature",
  },
  verb: {
    add: "new",
    edited: "edited",
    removed: "removed",
  },
  table: {
    received: "Received",
    type: "Type",
    status: "Status",
    authorSummary: "Author / preview",
    post: "Post",
    comment: "Comment",
    mediaPrefix: "media",
    igPrefix: "ig",
    empty: "—",
  },
  empty: {
    title: "No webhooks",
    body: "No events found with current filters.",
    sheetBody: "No events with current filters.",
  },
  detail: {
    post: "Post",
    comment: "Comment",
    author: "Author",
    entries: "Entries",
    payload: "Payload",
    payloadTruncated:
      "\n… (truncated in list — use export for full JSON)",
  },
  toasts: {
    loadFailed: "Failed to load webhooks.",
    exported: "Exported the last {count} webhooks.",
    exportFailed: "Failed to export webhooks.",
  },
} satisfies WebhooksMessages;
