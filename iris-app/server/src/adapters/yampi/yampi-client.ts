import type { YampiCredentials } from "../../domain/stores/store-types.ts";

export type YampiClientOptions = {
  fetchImpl?: typeof fetch;
};

export type YampiListProductsResponse = {
  data: unknown[];
  meta?: {
    pagination?: {
      current_page?: number;
      per_page?: number;
      total_pages?: number;
      total?: number;
    };
  };
};

export function createYampiClient(options: YampiClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;

  function authHeaders(credentials: YampiCredentials): HeadersInit {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Token": credentials.userToken,
      "User-Secret-Key": credentials.userSecretKey,
    };
  }

  function baseUrl(alias: string, path: string): string {
    const normalized = path.startsWith("/") ? path.slice(1) : path;
    return `https://api.dooki.com.br/v2/${encodeURIComponent(alias)}/${normalized}`;
  }

  async function readErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      return body.message ?? body.error ?? response.statusText;
    } catch {
      return response.statusText || `HTTP ${response.status}`;
    }
  }

  return {
    async testConnection(credentials: YampiCredentials): Promise<{ ok: boolean; message: string }> {
      const response = await fetchImpl("https://api.dooki.com.br/v2/auth/me", {
        method: "POST",
        headers: authHeaders(credentials),
      });

      if (!response.ok) {
        return {
          ok: false,
          message: await readErrorMessage(response),
        };
      }

      return { ok: true, message: "connected" };
    },

    async listProducts(
      credentials: YampiCredentials,
      params: { page?: number; perPage?: number } = {},
    ): Promise<YampiListProductsResponse> {
      const page = params.page ?? 1;
      const perPage = params.perPage ?? 50;
      const url = new URL(baseUrl(credentials.alias, "catalog/products"));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(perPage));
      url.searchParams.set("include", "skus,images,texts");

      const response = await fetchImpl(url, {
        method: "GET",
        headers: authHeaders(credentials),
      });

      if (!response.ok) {
        throw new Error(`yampi list products failed: ${await readErrorMessage(response)}`);
      }

      return (await response.json()) as YampiListProductsResponse;
    },

    async getProduct(
      credentials: YampiCredentials,
      externalProductId: string,
    ): Promise<unknown | null> {
      const url = baseUrl(
        credentials.alias,
        `catalog/products/${encodeURIComponent(externalProductId)}?include=skus,images,texts`,
      );

      const response = await fetchImpl(url, {
        method: "GET",
        headers: authHeaders(credentials),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`yampi get product failed: ${await readErrorMessage(response)}`);
      }

      const body = (await response.json()) as { data?: unknown };
      return body.data ?? null;
    },
  };
}

export type YampiClient = ReturnType<typeof createYampiClient>;
