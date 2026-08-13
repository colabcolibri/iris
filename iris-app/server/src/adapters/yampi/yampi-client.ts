import type { YampiCredentials } from "../../domain/stores/store-types.ts";
import {
  parseYampiMerchants,
  resolveYampiAliasFromMerchants,
  yampiAuthHeaders,
  type YampiAuthMeResult,
  type YampiMerchantSummary,
} from "./yampi-auth.ts";

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

export type YampiDiscoverResult = {
  merchants: YampiMerchantSummary[];
  resolved_alias: string | null;
};

export type YampiConnectionTestResult = YampiAuthMeResult & {
  resolved_alias: string | null;
};

export function createYampiClient(options: YampiClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;

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

  async function fetchAuthMe(
    credentials: Pick<YampiCredentials, "userToken" | "userSecretKey">,
  ): Promise<YampiAuthMeResult> {
    const response = await fetchImpl("https://api.dooki.com.br/v2/auth/me", {
      method: "POST",
      headers: yampiAuthHeaders(credentials),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response),
        merchants: [],
      };
    }

    const body = (await response.json()) as unknown;
    const merchants = parseYampiMerchants(body);
    if (merchants.length === 0) {
      return {
        ok: false,
        message: "credenciais válidas, mas nenhuma loja foi retornada em auth/me",
        merchants: [],
      };
    }

    return {
      ok: true,
      message: "credenciais válidas",
      merchants,
    };
  }

  return {
    async discoverMerchants(
      credentials: Pick<YampiCredentials, "userToken" | "userSecretKey">,
    ): Promise<YampiDiscoverResult> {
      const auth = await fetchAuthMe(credentials);
      if (!auth.ok) {
        throw new Error(auth.message);
      }

      const resolution = resolveYampiAliasFromMerchants(auth.merchants);
      return {
        merchants: auth.merchants,
        resolved_alias: resolution.resolvedAlias,
      };
    },

    async testConnection(credentials: YampiCredentials): Promise<YampiConnectionTestResult> {
      const auth = await fetchAuthMe(credentials);
      if (!auth.ok) {
        return {
          ...auth,
          resolved_alias: null,
        };
      }

      const resolution = resolveYampiAliasFromMerchants(auth.merchants, credentials.alias);
      if (!resolution.ok || !resolution.resolvedAlias) {
        return {
          ok: false,
          message: resolution.message,
          merchants: auth.merchants,
          resolved_alias: null,
        };
      }

      const probeUrl = new URL(baseUrl(resolution.resolvedAlias, "catalog/products"));
      probeUrl.searchParams.set("limit", "1");
      probeUrl.searchParams.set("include", "skus");

      const probe = await fetchImpl(probeUrl, {
        method: "GET",
        headers: yampiAuthHeaders(credentials),
      });

      if (!probe.ok) {
        return {
          ok: false,
          message: `alias "${resolution.resolvedAlias}" não acessou o catálogo: ${await readErrorMessage(probe)}`,
          merchants: auth.merchants,
          resolved_alias: resolution.resolvedAlias,
        };
      }

      return {
        ok: true,
        message: "connected",
        merchants: auth.merchants,
        resolved_alias: resolution.resolvedAlias,
      };
    },

    async listProducts(
      credentials: YampiCredentials,
      params: { page?: number; perPage?: number } = {},
    ): Promise<YampiListProductsResponse> {
      const alias = credentials.alias.trim();
      if (!alias) {
        throw new Error("yampi alias is required to list products");
      }

      const page = params.page ?? 1;
      const perPage = params.perPage ?? 50;
      const url = new URL(baseUrl(alias, "catalog/products"));
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(perPage));
      url.searchParams.set("include", "skus,images,texts");

      const response = await fetchImpl(url, {
        method: "GET",
        headers: yampiAuthHeaders(credentials),
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
      const alias = credentials.alias.trim();
      if (!alias) {
        throw new Error("yampi alias is required to get product");
      }

      const url = baseUrl(
        alias,
        `catalog/products/${encodeURIComponent(externalProductId)}?include=skus,images,texts`,
      );

      const response = await fetchImpl(url, {
        method: "GET",
        headers: yampiAuthHeaders(credentials),
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
