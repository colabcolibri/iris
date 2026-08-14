import type { HarnessTool } from "../../../ports/harness-tool.ts";
import { searchProductCatalog } from "../../products/product-catalog-search.ts";

export function createCatalogSearchProductsTool(): HarnessTool {
  return {
    name: "search_products",
    description:
      "Search active products by text (name, slug, description). Returns items, totalMatched, and suggestions when empty.",
    async execute(ctx, args) {
      const query = typeof args.query === "string" ? args.query : "";
      const limit =
        typeof args.limit === "number"
          ? Math.min(args.limit, ctx.budget.maxCatalogResults)
          : ctx.budget.maxCatalogResults;
      const activeOnly = args.active_only !== false;

      const result = searchProductCatalog(
        {
          products: ctx.products,
          productStoreLinks: ctx.productStoreLinks,
          productFieldPolicies: ctx.productFieldPolicies,
        },
        query,
        { limit, activeOnly },
      );

      return { success: true, output: result };
    },
  };
}
