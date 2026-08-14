import type { HarnessTool } from "../../../ports/harness-tool.ts";
import { resolveProductView, resolveProductViewBySlug } from "../resolve-product-view.ts";

export function createCatalogGetProductTool(): HarnessTool {
  return {
    name: "get_resolved_product",
    description:
      "Retorna um produto resolvido por product_id ou slug, com campos efetivos (Iris/loja).",
    async execute(ctx, args) {
      const productId = typeof args.product_id === "string" ? args.product_id.trim() : "";
      const slug = typeof args.slug === "string" ? args.slug.trim() : "";

      const deps = {
        products: ctx.products,
        productStoreLinks: ctx.productStoreLinks,
        productFieldPolicies: ctx.productFieldPolicies,
      };

      const view = productId
        ? resolveProductView(deps, productId)
        : slug
          ? resolveProductViewBySlug(deps, slug)
          : null;

      if (!view) {
        return { success: false, output: null, errorCode: "product_not_found" };
      }

      return { success: true, output: view };
    },
  };
}
