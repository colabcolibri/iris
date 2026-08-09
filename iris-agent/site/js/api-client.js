export function createApiClient(config) {
  const baseUrl = config.apiUrl.replace(/\/$/, "");

  async function request(path, init = {}) {
    const headers = new Headers(init.headers ?? {});
    headers.set("Authorization", `Bearer ${config.agentToken}`);

    if (init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = baseUrl ? `${baseUrl}${normalized}` : normalized;
    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message =
        typeof payload.error === "string"
          ? payload.error
          : `Erro ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async function fetchBinary(path) {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${config.agentToken}`);
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = baseUrl ? `${baseUrl}${normalized}` : normalized;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    return response.blob();
  }

  return {
    async listPosts(params = {}) {
      const query = new URLSearchParams();
      if (params.from) query.set("from", params.from);
      if (params.to) query.set("to", params.to);
      if (params.status) query.set("status", params.status);
      const suffix = query.toString() ? `?${query}` : "";
      const payload = await request(`/api/posts${suffix}`);
      return payload.posts ?? [];
    },

    async listAssets(postId) {
      const payload = await request(`/api/posts/${postId}/assets`);
      return payload.assets ?? [];
    },

    async fetchAssetBlob(postId, filename) {
      return fetchBinary(`/api/posts/${postId}/assets/${filename}`);
    },

    async health() {
      const url = baseUrl ? `${baseUrl}/health` : "/health";
      const response = await fetch(url);
      return response.ok;
    },
  };
}
