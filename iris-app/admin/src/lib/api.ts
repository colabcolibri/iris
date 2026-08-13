import type {
  AgentRunDetail,
  AgentRunListItem,
  AppSettings,
  AgentContent,
  Asset,
  AssetUserTag,
  BrowseMediaPage,
  Comment,
  CommentActivityItem,
  CommentActivityKind,
  CommentPostSummary,
  CommentsInbox,
  ConversationReplyMode,
  ConversationSummary,
  ImportMonitoredPostsBatchResult,
  LlmSettings,
  Message,
  MessageActivityItem,
  MessageActivityKind,
  MessageAgentContent,
  MetaStatus,
  McpSettings,
  McpSettingsGenerateResult,
  McpPermissionsSettings,
  McpPermissionPreset,
  Post,
  Product,
  ProductFieldKey,
  ProductFieldPoliciesResponse,
  ProductFieldPolicy,
  ProductStoreLink,
  StoreCatalogSyncResult,
  StoreConnection,
  StoreConnectionTestResult,
  FieldSource,
  YampiDiscoverResult,
  PostInsightsResult,
  UpdatePostBody,
  ReconcileCommentsPreview,
  ReconcileCommentsResult,
  ReplyAudit,
  ReplyInspection,
  ReplyMode,
  ReplyPersona,
  SyncPostCommentsResult,
  WebhookEvent,
  WebhookProcessingStatus,
} from "@/lib/types";
import { notifyUnauthorized } from "@/lib/auth-unauthorized";
import { getDemoMode, showDemoToast } from "@/demo/demo-mode-context";
import { getActiveDemoLocale } from "@/demo/demo-state";
import { getDemoUiMessages } from "@/demo/fixtures/i18n/ui";
import { demoApiFetch, demoFetchAssetBlob } from "@/demo/demo-api";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (getDemoMode()) {
    return demoApiFetch<T>(path, options);
  }

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
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
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
  params: {
    from?: string;
    to?: string;
    status?: string;
    calendarOnly?: boolean;
  } = {},
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

export function updatePost(postId: string, body: UpdatePostBody) {
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

/** Hard-delete: remove postagem cancelada do banco (e mídias). */
export function purgeCancelledPost(postId: string) {
  return apiFetch<null>(`/api/posts/${postId}/permanent`, {
    method: "DELETE",
  });
}

export function publishPostNow(postId: string) {
  return apiFetch<Post>(`/api/posts/${postId}/publish`, {
    method: "POST",
  });
}

export async function listAssets(postId: string) {
  const payload = await apiFetch<{ assets: Asset[] }>(
    `/api/posts/${postId}/assets`,
  );
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

export function updatePostAsset(
  postId: string,
  assetId: string,
  body: {
    alt_text?: string | null;
    user_tags?: AssetUserTag[] | string | null;
  },
) {
  return apiFetch<Asset>(`/api/posts/${postId}/assets/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function reorderPostAssets(postId: string, assetIds: string[]) {
  const payload = await apiFetch<{ assets: Asset[] }>(
    `/api/posts/${postId}/assets/reorder`,
    {
      method: "PUT",
      body: JSON.stringify({ asset_ids: assetIds }),
    },
  );
  return payload.assets ?? [];
}

export async function fetchCommentPosts() {
  const payload = await apiFetch<{ posts: CommentPostSummary[] }>(
    "/api/comments/posts",
  );
  return payload.posts ?? [];
}

export async function fetchCommentActivity(
  kind: CommentActivityKind,
  limit = 20,
) {
  const query = new URLSearchParams({ kind, limit: String(limit) });
  const payload = await apiFetch<{
    kind: CommentActivityKind;
    items: CommentActivityItem[];
  }>(`/api/comments/activity?${query}`);
  return payload.items ?? [];
}

export function syncPostComments(postId: string) {
  return apiFetch<SyncPostCommentsResult>(
    `/api/posts/${postId}/comments/sync`,
    {
      method: "POST",
    },
  );
}

export function fetchReconcileCommentsPreview(postId: string) {
  return apiFetch<ReconcileCommentsPreview>(
    `/api/posts/${postId}/comments/reconcile-preview`,
  );
}

export function reconcilePostComments(postId: string) {
  return apiFetch<ReconcileCommentsResult>(
    `/api/posts/${postId}/comments/reconcile`,
    {
      method: "POST",
    },
  );
}

export async function fetchComments(postId: string) {
  const payload = await apiFetch<{ comments: Comment[] }>(
    `/api/posts/${postId}/comments`,
  );
  return payload.comments ?? [];
}

export function fetchPostInsights(postId: string) {
  return apiFetch<PostInsightsResult>(`/api/posts/${postId}/insights`);
}

export function registerMonitoredPost(body: {
  ig_media_id?: string;
  permalink?: string;
}) {
  return apiFetch<Post>("/api/comments/monitored-posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function browseMetaMedia(
  params: { limit?: number; after?: string | null } = {},
) {
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
  return apiFetch<ImportMonitoredPostsBatchResult>(
    "/api/comments/monitored-posts/batch",
    {
      method: "POST",
      body: JSON.stringify({ ig_media_ids: igMediaIds }),
    },
  );
}

export function approveCommentReply(commentId: string, message?: string) {
  return apiFetch<Comment>(`/api/comments/${commentId}/approve-reply`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {}),
  });
}

export function requestCommentAiReply(
  commentId: string,
  mode: "auto" | "draft",
) {
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

export async function fetchAuthMe(): Promise<{
  authenticated: true;
  email: string;
} | null> {
  if (getDemoMode()) {
    return null;
  }

  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
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
  if (getDemoMode()) {
    return demoFetchAssetBlob(postId, filename);
  }

  const response = await fetch(`/api/posts/${postId}/assets/${filename}`, {
    credentials: "include",
  });
  if (response.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }
  if (!response.ok)
    throw new Error(`Failed to load asset (${response.status})`);
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
  onMessagesChanged?: (data: { conversation_id?: string }) => void;
  onConnectionChange?: (connected: boolean) => void;
}) {
  if (getDemoMode()) {
    handlers.onConnectionChange?.(false);
    return () => {
      handlers.onConnectionChange?.(false);
    };
  }

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
        handlers.onCommentsChanged?.(
          JSON.parse(event.data) as { post_id?: string },
        );
      } catch {
        // ignore malformed frames
      }
    });

    source.addEventListener("messages-changed", (event) => {
      try {
        handlers.onMessagesChanged?.(
          JSON.parse(event.data) as { conversation_id?: string },
        );
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

export async function fetchReplyAudit(
  commentId: string,
): Promise<ReplyAudit | null> {
  if (getDemoMode()) {
    return demoApiFetch<ReplyAudit | null>(
      `/api/comments/${commentId}/reply-audit`,
    );
  }

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
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<ReplyAudit>;
}

export function fetchConversations(limit = 50) {
  return apiFetch<{ conversations: ConversationSummary[] }>(
    `/api/conversations?limit=${limit}`,
  ).then((payload) => payload.conversations ?? []);
}

export function fetchConversationMessages(conversationId: string) {
  return apiFetch<{ conversation: ConversationSummary; messages: Message[] }>(
    `/api/conversations/${conversationId}/messages`,
  );
}

export function syncConversationMessages(conversationId: string) {
  return apiFetch<{ conversationId: string; imported: number; updated: number }>(
    `/api/conversations/${conversationId}/sync`,
    { method: "POST" },
  );
}

export function syncConversationsFromMeta(limit = 25) {
  return apiFetch<{ synced: number }>(`/api/conversations/sync?limit=${limit}`, {
    method: "POST",
  });
}

export function updateConversation(
  conversationId: string,
  body: { reply_mode?: ConversationReplyMode; reply_prompt?: string | null },
) {
  return apiFetch<ConversationSummary>(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function fetchMessageActivity(kind: MessageActivityKind, limit = 20) {
  return apiFetch<{ kind: MessageActivityKind; items: MessageActivityItem[] }>(
    `/api/conversations/activity?kind=${encodeURIComponent(kind)}&limit=${limit}`,
  ).then((payload) => payload.items ?? []);
}

export function approveMessageReply(messageId: string, message?: string) {
  return apiFetch<Message>(`/api/messages/${messageId}/approve-reply`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {}),
  });
}

export function requestMessageAiReply(messageId: string, mode: "auto" | "draft") {
  return apiFetch<Message>(`/api/messages/${messageId}/ai-reply`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export function removeMessageDraft(messageId: string) {
  return apiFetch<Message>(`/api/messages/${messageId}/draft`, {
    method: "DELETE",
  });
}

export function updateMessageDraft(messageId: string, message: string) {
  return apiFetch<Message>(`/api/messages/${messageId}/draft`, {
    method: "PATCH",
    body: JSON.stringify({ message }),
  });
}

export function replyToMessage(messageId: string, message: string) {
  return apiFetch<Message>(`/api/messages/${messageId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function fetchMessageReplyAudit(
  messageId: string,
): Promise<ReplyAudit | null> {
  if (getDemoMode()) {
    return demoApiFetch<ReplyAudit | null>(`/api/messages/${messageId}/reply-audit`);
  }

  const response = await fetch(`/api/messages/${messageId}/reply-audit`, {
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
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<ReplyAudit>;
}

export function fetchMessageAgentContent() {
  return apiFetch<MessageAgentContent>("/api/settings/message-agent-content");
}

export function updateMessageAgentContent(body: {
  dm_soul: string;
  dm_page: string;
  dm_knowledge: string;
  dm_restrictions: string;
}) {
  return apiFetch<MessageAgentContent>("/api/settings/message-agent-content", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchProducts(activeOnly = false) {
  const suffix = activeOnly ? "?active=true" : "";
  return apiFetch<{ products: Product[] }>(`/api/products${suffix}`).then(
    (payload) => payload.products ?? [],
  );
}

export function createProduct(body: {
  slug: string;
  name: string;
  short_description?: string;
  long_description?: string;
  active?: boolean;
  sort_order?: number;
}) {
  return apiFetch<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(
  productId: string,
  body: Partial<{
    slug: string;
    name: string;
    short_description: string;
    long_description: string;
    active: boolean;
    sort_order: number;
  }>,
) {
  return apiFetch<Product>(`/api/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProduct(productId: string) {
  return apiFetch<{ ok: boolean }>(`/api/products/${productId}`, {
    method: "DELETE",
  });
}

/** @deprecated Use deleteProduct — mantido por compatibilidade. */
export function deactivateProduct(productId: string) {
  return deleteProduct(productId);
}

export function fetchStoreConnections() {
  return apiFetch<{ store_connections: StoreConnection[] }>("/api/store-connections").then(
    (payload) => payload.store_connections ?? [],
  );
}

export function discoverYampiMerchants(body: {
  user_token: string;
  user_secret_key: string;
  alias?: string;
}) {
  return apiFetch<YampiDiscoverResult>("/api/store-connections/yampi/discover", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createStoreConnection(body: {
  provider_type: "yampi";
  label: string;
  alias?: string;
  user_token: string;
  user_secret_key: string;
}) {
  return apiFetch<StoreConnection>("/api/store-connections", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateStoreConnection(
  connectionId: string,
  body: Partial<{
    label: string;
    alias: string;
    user_token: string;
    user_secret_key: string;
    status: StoreConnection["status"];
    settings: Record<string, unknown>;
  }>,
) {
  return apiFetch<StoreConnection>(`/api/store-connections/${connectionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteStoreConnection(connectionId: string) {
  return apiFetch<{ ok: boolean }>(`/api/store-connections/${connectionId}`, {
    method: "DELETE",
  });
}

export function testStoreConnection(connectionId: string) {
  return apiFetch<StoreConnectionTestResult>(
    `/api/store-connections/${connectionId}/test`,
    { method: "POST" },
  );
}

export function syncStoreConnection(connectionId: string, importNew = false) {
  const suffix = importNew ? "?import_new=true" : "";
  return apiFetch<StoreCatalogSyncResult>(
    `/api/store-connections/${connectionId}/sync${suffix}`,
    { method: "POST" },
  );
}

export function fetchStoreFieldPolicies(connectionId: string) {
  return apiFetch<{ policies: ProductFieldPolicy[] }>(
    `/api/store-connections/${connectionId}/field-policies`,
  ).then((payload) => payload.policies ?? []);
}

export function updateStoreFieldPolicies(
  connectionId: string,
  policies: Partial<Record<ProductFieldKey, { source: FieldSource }>>,
) {
  return apiFetch<{ policies: ProductFieldPolicy[] }>(
    `/api/store-connections/${connectionId}/field-policies`,
    {
      method: "PATCH",
      body: JSON.stringify(policies),
    },
  ).then((payload) => payload.policies ?? []);
}

export function fetchProductStoreLinks(productId: string) {
  return apiFetch<{ links: ProductStoreLink[] }>(
    `/api/products/${productId}/store-links`,
  ).then((payload) => payload.links ?? []);
}

export function linkProductToStore(
  productId: string,
  body: { store_connection_id: string; external_product_id: string },
) {
  return apiFetch<ProductStoreLink>(`/api/products/${productId}/store-links`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function unlinkProductFromStore(productId: string, linkId: string) {
  return apiFetch<{ ok: boolean }>(
    `/api/products/${productId}/store-links/${linkId}`,
    { method: "DELETE" },
  );
}

export function fetchProductFieldPolicies(productId: string, storeConnectionId: string) {
  return apiFetch<ProductFieldPoliciesResponse>(
    `/api/products/${productId}/field-policies?store_connection_id=${encodeURIComponent(storeConnectionId)}`,
  );
}

export function updateProductFieldPolicies(
  productId: string,
  body: {
    store_connection_id: string;
    policies: Partial<
      Record<ProductFieldKey, { source: FieldSource | "inherit" }>
    >;
  },
) {
  return apiFetch<{ policies: ProductFieldPolicy[] }>(
    `/api/products/${productId}/field-policies`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  ).then((payload) => payload.policies ?? []);
}

export function fetchAppSettings() {
  return apiFetch<AppSettings>("/api/settings/app");
}

export function updateAppSettings(body: {
  timezone?: string;
  reply_mode?: ReplyMode;
  auto_reply_enabled?: boolean;
  reply_delay_seconds?: number;
  agent_reply_tick_interval_seconds?: number;
  message_reply_mode?: ReplyMode;
  message_auto_reply_enabled?: boolean;
  message_reply_delay_seconds?: number;
  auto_monitor_enabled?: boolean;
  auto_monitor_interval_seconds?: number;
}) {
  return apiFetch<AppSettings>("/api/settings/app", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export type { McpSettings, McpSettingsGenerateResult, McpPermissionsSettings, McpPermissionPreset };

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

export function fetchMcpPermissions() {
  return apiFetch<McpPermissionsSettings>("/api/settings/mcp/permissions");
}

export function updateMcpPermissions(body: {
  preset: McpPermissionPreset;
  domain_overrides?: Partial<
    Record<string, Partial<{ read: boolean; write: boolean; delete: boolean }>>
  >;
}) {
  return apiFetch<McpPermissionsSettings>("/api/settings/mcp/permissions", {
    method: "PUT",
    body: JSON.stringify(body),
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
  return apiFetch<{ events: WebhookEvent[] }>(
    `/api/settings/webhook-events?${params}`,
  ).then((payload) => payload.events);
}

export function fetchPostInsightsHistory(postId: string, limit = 30) {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  return apiFetch<{
    post_id: string;
    ig_media_id: string | null;
    snapshots: PostInsightsResult[];
  }>(`/api/posts/${postId}/insights/history?limit=${safeLimit}`);
}

export function refreshAllPostInsights(
  body: {
    limit?: number;
    delay_ms?: number;
    force?: boolean;
    /** ISO — filtra por published_at */
    since?: string;
    until?: string;
  } = {},
) {
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
  if (getDemoMode()) {
    showDemoToast(getDemoUiMessages(getActiveDemoLocale()).exportNotAvailable);
    void limit;
    void filter;
    return;
  }

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
  const response = await fetch(
    `/api/settings/webhook-events/export?${params}`,
    {
      credentials: "include",
    },
  );

  if (response.status === 401) {
    notifyUnauthorized();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename =
    match?.[1] ?? `iris-webhooks-${new Date().toISOString().slice(0, 10)}.json`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fetchAgentRuns(
  params: {
    limit?: number;
    cursor?: string;
    terminal_status?: string;
    reply_tier?: string;
  } = {},
) {
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
  channel?: "comment" | "dm";
  caption?: string | null;
  carousel_summary?: string | null;
  response_language?: string;
  brand_name?: string | null;
  max_chars?: number;
  thread?: SimulateThreadMessage[];
  target_comment?: { author: string; text: string };
  target_message?: { author: string; text: string };
  participant_username?: string | null;
  reply_prompt?: string | null;
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
