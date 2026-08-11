import type { AgentRunDetail, AgentRunListItem, AppSettings, AgentContent, Asset, BrowseMediaPage, Comment, CommentActivityItem, CommentActivityKind, CommentPostSummary, CommentsInbox, ImportMonitoredPostsBatchResult, LlmSettings, MetaStatus, McpSettings, McpSettingsGenerateResult, Post, PostInsightsResult, ReconcileCommentsPreview, ReconcileCommentsResult, ReplyAudit, ReplyInspection, ReplyMode, ReplyPersona, SyncPostCommentsResult, WebhookEvent, WebhookProcessingStatus } from "@/lib/types";
import { notifyUnauthorized } from "@/lib/auth-unauthorized";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response as T;
}

export async function fetchPosts(
  params: { from?: string; to?: string; status?: string; calendarOnly?: boolean } = {},
) {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  if (params.calendarOnly) query.set("calendar_only", "1");
  const suffix = query.toString() ? `?${query}` : "";
  const payload = await apiFetch<{ posts: Post[] }>(`/api/posts${suffix}`);
  return payload.posts ?? [];
}

export function fetchPost(postId: string) {
  return apiFetch<Post>(`/api/posts/${postId}`);
}

export function createPost(body: Record<string, unknown>) {
  return apiFetch<Post>("/api/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updatePost(postId: string, body: Record<string, unknown>) {
  return apiFetch<Post>(`/api/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Soft-delete: marca a postagem como `cancelled` (DELETE admin). */
export function deletePost(postId: string) {
  return apiFetch<Post>(`/api/posts/${postId}`, {
    method: "DELETE",
  });
}

export function publishPostNow(postId: string) {
  return apiFetch<Post>(`/api/posts/${postId}/publish`, {
    method: "POST",
  });
}

export async function listAssets(postId: string) {
  const payload = await apiFetch<{ assets: Asset[] }>(`/api/posts/${postId}/assets`);
  return payload.assets ?? [];
}

export function uploadAsset(postId: string, file: File, sortOrder: number) {
  const form = new FormData();
  form.append("file", file);
  form.append("sort_order", String(sortOrder));
  return apiFetch(`/api/posts/${postId}/assets`, {
    method: "POST",
    body: form,
  });
}

export function deletePostAsset(postId: string, assetId: string) {
  return apiFetch<void>(`/api/posts/${postId}/assets/${assetId}`, {
    method: "DELETE",
  });
}

export async function reorderPostAssets(postId: string, assetIds: string[]) {
  const payload = await apiFetch<{ assets: Asset[] }>(`/api/posts/${postId}/assets/reorder`, {
    method: "PUT",
    body: JSON.stringify({ asset_ids: assetIds }),
  });
  return payload.assets ?? [];
}

export async function fetchCommentPosts() {
  const payload = await apiFetch<{ posts: CommentPostSummary[] }>("/api/comments/posts");
  return payload.posts ?? [];
}

export async function fetchCommentActivity(kind: CommentActivityKind, limit = 20) {
  const query = new URLSearchParams({ kind, limit: String(limit) });
  const payload = await apiFetch<{ kind: CommentActivityKind; items: CommentActivityItem[] }>(
    `/api/comments/activity?${query}`,
  );
  return payload.items ?? [];
}

export function syncPostComments(postId: string) {
  return apiFetch<SyncPostCommentsResult>(`/api/posts/${postId}/comments/sync`, {
    method: "POST",
  });
}

export function fetchReconcileCommentsPreview(postId: string) {
  return apiFetch<ReconcileCommentsPreview>(
    `/api/posts/${postId}/comments/reconcile-preview`,
  );
}

export function reconcilePostComments(postId: string) {
  return apiFetch<ReconcileCommentsResult>(`/api/posts/${postId}/comments/reconcile`, {
    method: "POST",
  });
}

export async function fetchComments(postId: string) {
  const payload = await apiFetch<{ comments: Comment[] }>(`/api/posts/${postId}/comments`);
  return payload.comments ?? [];
}

export function fetchPostInsights(postId: string) {
  return apiFetch<PostInsightsResult>(`/api/posts/${postId}/insights`);
}

export function registerMonitoredPost(body: { ig_media_id?: string; permalink?: string }) {
  return apiFetch<Post>("/api/comments/monitored-posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function browseMetaMedia(params: { limit?: number; after?: string | null } = {}) {
  const query = new URLSearchParams();
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  if (params.after) {
    query.set("after", params.after);
  }
  const suffix = query.toString() ? `?${query}` : "";
  return apiFetch<BrowseMediaPage>(`/api/meta/media/browse${suffix}`);
}

export function importMonitoredPostsBatch(igMediaIds: string[]) {
  return apiFetch<ImportMonitoredPostsBatchResult>("/api/comments/monitored-posts/batch", {
    method: "POST",
    body: JSON.stringify({ ig_media_ids: igMediaIds }),
  });
}

export function approveCommentReply(commentId: string, message?: string) {
  return apiFetch<Comment>(`/api/comments/${commentId}/approve-reply`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {}),
  });
}

export function requestCommentAiReply(commentId: string, mode: "auto" | "draft") {
  return apiFetch<Comment>(`/api/comments/${commentId}/ai-reply`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export function removeCommentDraft(commentId: string) {
  return apiFetch<Comment>(`/api/comments/${commentId}/draft`, {
    method: "DELETE",
  });
}

export function updateCommentDraft(commentId: string, message: string) {
  return apiFetch<Comment>(`/api/comments/${commentId}/draft`, {
    method: "PATCH",
    body: JSON.stringify({ message }),
  });
}

export function fetchReplyInspection(postId: string) {
  return apiFetch<ReplyInspection>(`/api/posts/${postId}/reply-inspection`);
}

export function fetchCommentsInbox(
  options: {
    days?: number;
    igMediaId?: string;
    postId?: string;
    source?: "local" | "meta";
    scope?: "iris" | "all";
  } = {},
) {
  const params = new URLSearchParams();
  params.set("days", String(options.days ?? 30));
  params.set("source", options.source ?? "local");
  if (options.source === "meta") {
    params.set("scope", options.scope ?? "iris");
  }
  if (options.igMediaId) {
    params.set("ig_media_id", options.igMediaId);
  }
  if (options.postId) {
    params.set("post_id", options.postId);
  }
  return apiFetch<CommentsInbox>(`/api/comments/inbox?${params.toString()}`);
}

export function replyToComment(commentId: string, message: string) {
  return apiFetch(`/api/comments/${commentId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function fetchAuthMe(): Promise<{ authenticated: true; email: string } | null> {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<{ authenticated: true; email: string }>;
}

export function fetchMetaStatus() {
  return apiFetch<MetaStatus>("/api/meta/status");
}

export function fetchMetaHealth() {
  return apiFetch<{ ok: boolean; message?: string }>("/api/meta/health");
}

export function disconnectMeta() {
  return apiFetch<{ ok: true }>("/api/meta/disconnect", { method: "POST" });
}

export async function fetchAssetBlob(postId: string, filename: string) {
  const response = await fetch(`/api/posts/${postId}/assets/${filename}`, {
    credentials: "include",
  });
  if (response.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!response.ok) throw new Error(`Failed to load asset (${response.status})`);
  return response.blob();
}

export function requestLoginCode(email: string) {
  return apiFetch("/api/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmLoginCode(email: string, code: string) {
  return apiFetch("/api/auth/confirm", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function subscribeRealtimeEvents(handlers: {
  onPostsChanged?: (data: unknown) => void;
  onCommentsChanged?: (data: { post_id?: string }) => void;
  onConnectionChange?: (connected: boolean) => void;
}) {
  let aborted = false;
  let retryMs = 1000;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let source: EventSource | null = null;

  const scheduleReconnect = () => {
    if (aborted) {
      return;
    }

    handlers.onConnectionChange?.(false);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, retryMs);
    retryMs = Math.min(retryMs * 2, 30_000);
  };

  const connect = () => {
    if (aborted) {
      return;
    }

    source?.close();
    source = new EventSource("/api/events");

    source.onopen = () => {
      retryMs = 1000;
      handlers.onConnectionChange?.(true);
    };

    source.addEventListener("posts-changed", (event) => {
      try {
        handlers.onPostsChanged?.(JSON.parse(event.data));
      } catch {
        // ignore malformed frames
      }
    });

    source.addEventListener("comments-changed", (event) => {
      try {
        handlers.onCommentsChanged?.(JSON.parse(event.data) as { post_id?: string });
      } catch {
        // ignore malformed frames
      }
    });

    source.onerror = () => {
      source?.close();
      source = null;
      scheduleReconnect();
    };
  };

  connect();

  return () => {
    aborted = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
    source?.close();
    handlers.onConnectionChange?.(false);
  };
}

export function fetchReplyPersona() {
  return apiFetch<ReplyPersona>("/api/settings/reply-persona");
}

export function updateReplyPersona(body: {
  response_language: string;
  brand_name: string | null;
  signature_instruction: string;
  max_chars: number;
}) {
  return apiFetch<ReplyPersona>("/api/settings/reply-persona", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchAgentContent() {
  return apiFetch<AgentContent>("/api/settings/agent-content");
}

export function updateAgentContent(body: {
  soul: string;
  page: string;
  knowledge: string;
  restrictions: string;
}) {
  return apiFetch<AgentContent>("/api/settings/agent-content", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchReplyAudit(commentId: string): Promise<ReplyAudit | null> {
  const response = await fetch(`/api/comments/${commentId}/reply-audit`, {
    credentials: "include",
  });

  if (response.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<ReplyAudit>;
}

export function fetchAppSettings() {
  return apiFetch<AppSettings>("/api/settings/app");
}

export function updateAppSettings(body: {
  timezone?: string;
  reply_mode?: ReplyMode;
  auto_reply_enabled?: boolean;
  reply_delay_seconds?: number;
  auto_monitor_enabled?: boolean;
  auto_monitor_interval_seconds?: number;
}) {
  return apiFetch<AppSettings>("/api/settings/app", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export type { McpSettings, McpSettingsGenerateResult };

export function fetchMcpSettings() {
  return apiFetch<McpSettings>("/api/settings/mcp");
}

export function generateMcpConnection() {
  return apiFetch<McpSettingsGenerateResult>("/api/settings/mcp", {
    method: "POST",
  });
}

export function revokeMcpConnection() {
  return apiFetch<McpSettings>("/api/settings/mcp", {
    method: "DELETE",
  });
}

export type { LlmSettings };

export function fetchLlmSettings() {
  return apiFetch<LlmSettings>("/api/settings/llm");
}

export function updateLlmSettings(body: {
  api_url: string;
  model: string;
  supports_vision: boolean;
  api_key?: string;
}) {
  return apiFetch<LlmSettings>("/api/settings/llm", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchWebhookEvents(
  limit = 30,
  filter: {
    status?: WebhookProcessingStatus;
    field?: string;
    signatureValid?: boolean;
  } = {},
) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const params = new URLSearchParams({ limit: String(safeLimit) });
  if (filter.status) {
    params.set("status", filter.status);
  }
  if (filter.field) {
    params.set("field", filter.field);
  }
  if (filter.signatureValid === false) {
    params.set("signature_valid", "0");
  } else if (filter.signatureValid === true) {
    params.set("signature_valid", "1");
  }
  return apiFetch<{ events: WebhookEvent[] }>(`/api/settings/webhook-events?${params}`).then(
    (payload) => payload.events,
  );
}

export function fetchPostInsightsHistory(postId: string, limit = 30) {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  return apiFetch<{
    post_id: string;
    ig_media_id: string | null;
    snapshots: PostInsightsResult[];
  }>(`/api/posts/${postId}/insights/history?limit=${safeLimit}`);
}

export function refreshAllPostInsights(body: {
  limit?: number;
  delay_ms?: number;
  force?: boolean;
} = {}) {
  return apiFetch<{
    requested: number;
    refreshed: string[];
    failed: Array<{ post_id: string; error: string }>;
    skipped: string[];
    delay_ms: number;
  }>("/api/insights/refresh-all", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function downloadWebhookEventsExport(
  limit: number,
  filter: {
    status?: WebhookProcessingStatus;
    field?: string;
    signatureValid?: boolean;
  } = {},
) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 10_000);
  const params = new URLSearchParams({ limit: String(safeLimit) });
  if (filter.status) {
    params.set("status", filter.status);
  }
  if (filter.field) {
    params.set("field", filter.field);
  }
  if (filter.signatureValid === false) {
    params.set("signature_valid", "0");
  } else if (filter.signatureValid === true) {
    params.set("signature_valid", "1");
  }
  const response = await fetch(`/api/settings/webhook-events/export?${params}`, {
    credentials: "include",
  });

  if (response.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `iris-webhooks-${new Date().toISOString().slice(0, 10)}.json`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fetchAgentRuns(params: {
  limit?: number;
  cursor?: string;
  terminal_status?: string;
  reply_tier?: string;
} = {}) {
  const search = new URLSearchParams();
  if (params.limit) {
    search.set("limit", String(params.limit));
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }
  if (params.terminal_status) {
    search.set("terminal_status", params.terminal_status);
  }
  if (params.reply_tier) {
    search.set("reply_tier", params.reply_tier);
  }
  const query = search.toString();
  return apiFetch<{ items: AgentRunListItem[]; next_cursor: string | null }>(
    `/api/agent-runs${query ? `?${query}` : ""}`,
  );
}

export function fetchAgentRunDetail(runId: string) {
  return apiFetch<AgentRunDetail>(`/api/agent-runs/${runId}`);
}

export type SimulateThreadMessage = {
  author: string;
  text: string;
  is_brand_reply?: boolean;
  at?: string;
};

export type SimulateReplyResult = {
  audit: ReplyAudit;
  final_text: string | null;
  terminal_status: ReplyAudit["terminal_status"];
  reply_tier: ReplyAudit["reply_tier"];
  response_language: string;
};

export function simulateAgentReply(body: {
  caption?: string | null;
  carousel_summary?: string | null;
  response_language?: string;
  brand_name?: string | null;
  max_chars?: number;
  thread?: SimulateThreadMessage[];
  target_comment: { author: string; text: string };
}) {
  return apiFetch<SimulateReplyResult>("/api/agent/simulate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function generatePostCarouselSummary(postId: string) {
  return apiFetch<{ carousel_summary: string }>(
    `/api/posts/${postId}/generate-carousel-summary`,
    { method: "POST" },
  );
}
