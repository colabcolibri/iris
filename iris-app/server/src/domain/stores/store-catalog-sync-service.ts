import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import type { StoreConnectionRepository } from "../../ports/store-connection-repository.ts";
import type { StoreProviderRegistry } from "./store-provider-registry.ts";
import { dedupeSlug, slugFromName } from "./slug-from-name.ts";

export type StoreCatalogSyncResult = {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ externalId: string; message: string }>;
};

export type StoreCatalogSyncServiceDeps = {
  storeConnections: StoreConnectionRepository;
  productStoreLinks: ProductStoreLinkRepository;
  products: ProductRepository;
  storeProviders: StoreProviderRegistry;
};

export type StoreCatalogSyncOptions = {
  importNew?: boolean;
  maxPages?: number;
};

export function createStoreCatalogSyncService(deps: StoreCatalogSyncServiceDeps) {
  return {
    async syncStoreConnection(
      storeConnectionId: string,
      options: StoreCatalogSyncOptions = {},
    ): Promise<StoreCatalogSyncResult> {
      const connection = deps.storeConnections.findById(storeConnectionId);
      if (!connection) {
        throw new Error("store connection not found");
      }

      const credentials = deps.storeConnections.getCredentials(storeConnectionId);
      if (!credentials) {
        throw new Error("store connection has no credentials");
      }

      const provider = deps.storeProviders.get(connection.providerType);
      const result: StoreCatalogSyncResult = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      let page = 1;
      const maxPages = options.maxPages ?? 20;
      let hasMore = true;

      while (hasMore && page <= maxPages) {
        const pageResult = await provider.listExternalProducts(credentials, {
          page,
          perPage: 50,
        });

        for (const external of pageResult.items) {
          try {
            const existingLink = deps.productStoreLinks.findByExternalId(
              storeConnectionId,
              external.externalId,
            );

            if (existingLink) {
              deps.productStoreLinks.upsert({
                productId: existingLink.productId,
                storeConnectionId,
                externalProductId: external.externalId,
                externalSku: external.sku,
                snapshot: external,
              });
              result.updated += 1;
              continue;
            }

            if (!options.importNew) {
              result.skipped += 1;
              continue;
            }

            const slug = dedupeSlug(slugFromName(external.name), (candidate) =>
              Boolean(deps.products.findBySlug(candidate)),
            );

            const product = deps.products.create({
              slug,
              name: external.name,
              shortDescription: external.shortDescription,
              longDescription: external.longDescription,
              active: true,
            });

            deps.productStoreLinks.upsert({
              productId: product.id,
              storeConnectionId,
              externalProductId: external.externalId,
              externalSku: external.sku,
              snapshot: external,
            });
            result.imported += 1;
          } catch (error) {
            result.errors.push({
              externalId: external.externalId,
              message: error instanceof Error ? error.message : "sync failed",
            });
          }
        }

        hasMore = pageResult.hasMore;
        page += 1;
      }

      deps.storeConnections.update(storeConnectionId, {
        lastSyncAt: new Date().toISOString(),
        lastError: result.errors.length > 0 ? result.errors[0]!.message : null,
        status: result.errors.length > 0 ? "error" : "active",
      });

      return result;
    },
  };
}

export type StoreCatalogSyncService = ReturnType<typeof createStoreCatalogSyncService>;
