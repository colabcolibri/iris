import type { HarnessTool } from "../../../ports/harness-tool.ts";
import { searchResolvedProducts } from "../resolve-product-view.ts";

export function createCatalogSearchProductsTool(): HarnessTool {
  return {
    name: "search_products",
    description:
      "Busca produtos ativos por texto (nome, slug, descrição, sku). Retorna lista resolvida com preço/url conforme políticas.",
    async execute(ctx, args) {
      const query = typeof args.query === "string" ? args.query : "";
      const limit =
        typeof args.limit === "number"
          ? Math.min(args.limit, ctx.budget.maxCatalogResults)
          : ctx.budget.maxCatalogResults;
      const activeOnly = args.active_only !== false;

      const items = searchResolvedProducts(
        {
          products: ctx.products,
          productStoreLinks: ctx.productStoreLinks,
          productFieldPolicies: ctx.productFieldPolicies,
        },
        query,
        { limit, activeOnly },
      );

      return { success: true, output: { items } };
    },
  };
}
