import type { AppSettings, Asset, Comment, CommentPostSummary, CommentsInbox, LlmSettings, MetaStatus, McpSettings, McpSettingsGenerateResult, Post, ReplyInspection, ReplyPersona, SyncPostCommentsResult } from "@/lib/types";
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

export async function fetchCommentPosts() {
  const payload = await apiFetch<{ posts: CommentPostSummary[] }>("/api/comments/posts");
  return payload.posts ?? [];
}

export function syncPostComments(postId: string) {
  return apiFetch<SyncPostCommentsResult>(`/api/posts/${postId}/comments/sync`, {
    method: "POST",
  });
}

export async function fetchComments(postId: string) {
  const payload = await apiFetch<{ comments: Comment[] }>(`/api/posts/${postId}/comments`);
  return payload.comments ?? [];
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

function parseSseChunk(
  chunk: string,
  onEvent: (eventName: string, data: unknown) => void,
) {
  const blocks = chunk.split("\n\n");
  const remainder = blocks.pop() ?? "";

  for (const block of blocks) {
    const lines = block.split("\n");
    let eventName = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }

    if (data) onEvent(eventName, JSON.parse(data));
  }

  return remainder;
}

export function subscribeRealtimeEvents(handlers: {
  onPostsChanged?: (data: unknown) => void;
  onCommentsChanged?: (data: { post_id?: string }) => void;
}) {
  let aborted = false;
  let retryMs = 1000;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const connect = async () => {
    while (!aborted) {
      try {
        const response = await fetch("/api/events", { credentials: "include" });
        if (!response.ok || !response.body) throw new Error("sse connection failed");

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        retryMs = 1000;

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseSseChunk(buffer, (eventName, data) => {
            if (eventName === "posts-changed") handlers.onPostsChanged?.(data);
            if (eventName === "comments-changed")
              handlers.onCommentsChanged?.(data as { post_id?: string });
          });
        }
      } catch {
        if (aborted) return;
        await new Promise((r) => setTimeout(r, retryMs));
        retryMs = Math.min(retryMs * 2, 30_000);
      }
    }
  };

  void connect();

  return () => {
    aborted = true;
    reader?.cancel().catch(() => undefined);
  };
}

export function fetchReplyPersona() {
  return apiFetch<ReplyPersona>("/api/settings/reply-persona");
}

export function updateReplyPersona(body: {
  system_prompt: string;
  tone: string;
  brand_name: string | null;
  max_chars: number;
}) {
  return apiFetch<ReplyPersona>("/api/settings/reply-persona", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchAppSettings() {
  return apiFetch<AppSettings>("/api/settings/app");
}

export function updateAppSettings(body: { timezone: string }) {
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
