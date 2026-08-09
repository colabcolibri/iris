async function apiFetch(path, options = {}) {
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
    const authError = new Error("Unauthorized");
    authError.name = "UnauthorizedError";
    throw authError;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error ?? `Request failed (${response.status})`;
    const error = new Error(message);
    if (payload.code) {
      error.code = payload.code;
    }
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response;
}

export async function fetchPosts(params = {}) {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query}` : "";
  const payload = await apiFetch(`/api/posts${suffix}`);
  return payload.posts ?? [];
}

export async function fetchPost(postId) {
  return apiFetch(`/api/posts/${postId}`);
}

export async function createPost(body) {
  return apiFetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePost(postId, body) {
  return apiFetch(`/api/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function listAssets(postId) {
  const payload = await apiFetch(`/api/posts/${postId}/assets`);
  return payload.assets ?? [];
}

export async function uploadAsset(postId, file, sortOrder) {
  const form = new FormData();
  form.append("file", file);
  form.append("sort_order", String(sortOrder));
  return apiFetch(`/api/posts/${postId}/assets`, {
    method: "POST",
    body: form,
  });
}

export async function fetchComments(postId) {
  const payload = await apiFetch(`/api/posts/${postId}/comments`);
  return payload.comments ?? [];
}

export async function replyToComment(commentId, message) {
  return apiFetch(`/api/comments/${commentId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function fetchMetaStatus() {
  return apiFetch("/api/meta/status");
}

export async function fetchMetaHealth() {
  return apiFetch("/api/meta/health");
}

export async function fetchAssetBlob(postId, filename) {
  const response = await fetch(`/api/posts/${postId}/assets/${filename}`, {
    credentials: "include",
  });

  if (response.status === 401) {
    const authError = new Error("Unauthorized");
    authError.name = "UnauthorizedError";
    throw authError;
  }

  if (!response.ok) {
    throw new Error(`Failed to load asset (${response.status})`);
  }

  return response.blob();
}

function parseSseChunk(chunk, onEvent) {
  const blocks = chunk.split("\n\n");
  const remainder = blocks.pop() ?? "";

  for (const block of blocks) {
    const lines = block.split("\n");
    let eventName = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      }
    }

    if (data) {
      onEvent(eventName, JSON.parse(data));
    }
  }

  return remainder;
}

export function subscribePostsChanged(onEvent) {
  return subscribeRealtimeEvents({
    onPostsChanged: onEvent,
  });
}

export function subscribeRealtimeEvents({ onPostsChanged, onCommentsChanged }) {
  let aborted = false;
  let retryMs = 1000;
  let reader = null;

  const connect = async () => {
    while (!aborted) {
      try {
        const response = await fetch("/api/events", {
          credentials: "include",
        });

        if (!response.ok || !response.body) {
          throw new Error("sse connection failed");
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        retryMs = 1000;

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          buffer = parseSseChunk(buffer, (eventName, data) => {
            if (eventName === "posts-changed" && onPostsChanged) {
              onPostsChanged(data);
            }
            if (eventName === "comments-changed" && onCommentsChanged) {
              onCommentsChanged(data);
            }
          });
        }
      } catch {
        if (aborted) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, retryMs));
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

export async function ensureAuthenticated() {
  try {
    await fetchPosts();
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      window.location.href = "/login.html";
      return false;
    }
    throw error;
  }
}
