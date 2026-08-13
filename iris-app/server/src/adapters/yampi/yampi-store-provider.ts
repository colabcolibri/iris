import type { StoreProvider } from "../../ports/store-provider.ts";
import type {
  ExternalProduct,
  StoreConnectionTestResult,
  StoreCredentials,
} from "../../domain/stores/store-types.ts";
import { createYampiClient, type YampiClient } from "./yampi-client.ts";
import { mapYampiProduct, mapYampiProductPage } from "./yampi-product-mapper.ts";

function readYampiCredentials(credentials: StoreCredentials) {
  if (credentials.providerType !== "yampi") {
    throw new Error("expected yampi credentials");
  }
  return credentials.yampi;
}

export function createYampiStoreProvider(client: YampiClient = createYampiClient()): StoreProvider {
  return {
    providerType: "yampi",

    async testConnection(credentials: StoreCredentials): Promise<StoreConnectionTestResult> {
      const yampi = readYampiCredentials(credentials);
      if (!yampi.userToken.trim() || !yampi.userSecretKey.trim()) {
        return { ok: false, message: "userToken and userSecretKey are required" };
      }
      const result = await client.testConnection(yampi);
      return {
        ok: result.ok,
        message: result.message,
        resolved_alias: result.resolved_alias,
        merchants: result.merchants,
      };
    },

    async listExternalProducts(credentials, options = {}) {
      const yampi = readYampiCredentials(credentials);
      const perPage = options.perPage ?? 50;
      const page = options.page ?? 1;
      const response = await client.listProducts(yampi, { page, perPage });
      const mapped = mapYampiProductPage(response, perPage);
      return {
        items: mapped.items,
        page: mapped.page,
        perPage: mapped.perPage,
        hasMore: mapped.hasMore,
      };
    },

    async getExternalProduct(credentials, externalProductId) {
      const yampi = readYampiCredentials(credentials);
      const raw = await client.getProduct(yampi, externalProductId);
      if (!raw) {
        return null;
      }
      return mapYampiProduct(raw);
    },
  };
}
