import type { HarnessTool } from "../../../ports/harness-tool.ts";
import { resolveProductFields } from "../../products/product-field-resolver.ts";
import { resolveProductView } from "../resolve-product-view.ts";

export function createCatalogRefreshStoreSnapshotTool(): HarnessTool {
  return {
    name: "refresh_store_snapshot",
    description:
      "Atualiza snapshot da loja para um produto linkado e retorna a view resolvida. Rate limit por sessão.",
    async execute(ctx, args) {
      if (ctx.refreshCount >= ctx.budget.maxRefreshPerSession) {
        return {
          success: false,
          output: null,
          errorCode: "refresh_rate_limited",
        };
      }

      const productId = typeof args.product_id === "string" ? args.product_id.trim() : "";
      if (!productId) {
        return { success: false, output: null, errorCode: "product_id_required" };
      }

      const product = ctx.products.findById(productId);
      if (!product) {
        return { success: false, output: null, errorCode: "product_not_found" };
      }

      const storeConnectionId =
        typeof args.store_connection_id === "string" ? args.store_connection_id.trim() : "";

      const links = ctx.productStoreLinks.listByProduct(productId);
      const link = storeConnectionId
        ? links.find((entry) => entry.storeConnectionId === storeConnectionId) ?? null
        : links[0] ?? null;

      if (!link) {
        return { success: false, output: null, errorCode: "store_link_not_found" };
      }

      const connection = ctx.storeConnections.findById(link.storeConnectionId);
      if (!connection) {
        return { success: false, output: null, errorCode: "store_connection_not_found" };
      }

      const credentials = ctx.storeConnections.getCredentials(link.storeConnectionId);
      if (!credentials) {
        return { success: false, output: null, errorCode: "store_credentials_missing" };
      }

      const provider = ctx.storeProviders.get(connection.providerType);
      const external = await provider.getExternalProduct(credentials, link.externalProductId);
      if (!external) {
        return { success: false, output: null, errorCode: "external_product_not_found" };
      }

      ctx.productStoreLinks.upsert({
        productId,
        storeConnectionId: link.storeConnectionId,
        externalProductId: link.externalProductId,
        externalSku: external.sku,
        snapshot: external,
      });

      ctx.refreshCount += 1;

      const globalPolicies = ctx.productFieldPolicies.listGlobal(link.storeConnectionId);
      const productPolicies = ctx.productFieldPolicies.listForProduct(
        link.storeConnectionId,
        productId,
      );

      const view = resolveProductFields({
        product,
        snapshot: external,
        globalPolicies,
        productPolicies,
      });

      return { success: true, output: view };
    },
  };
}
