const TOKEN_KEY = "iris_admin_token";

export function getToken() {
  let token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = window.prompt("Token admin (IRIS_ADMIN_TOKEN):") ?? "";
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }
  return token;
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Authorization", `Bearer ${getToken()}`);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `Request failed (${response.status})`);
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

export async function fetchPosts() {
  const payload = await apiFetch("/api/posts");
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

export async function fetchAssetBlob(postId, filename) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  const response = await fetch(`/api/posts/${postId}/assets/${filename}`, {
    headers,
  });

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
  let aborted = false;
  let retryMs = 1000;
  let reader = null;

  const connect = async () => {
    while (!aborted) {
      try {
        const response = await fetch("/api/events", {
          headers: { Authorization: `Bearer ${getToken()}` },
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
            if (eventName === "posts-changed") {
              onEvent(data);
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
