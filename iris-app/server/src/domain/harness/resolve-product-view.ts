import type { ProductFieldPolicyRepository } from "../../ports/product-field-policy-repository.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import { resolveProductFields } from "../products/product-field-resolver.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";

export type ResolveProductViewDeps = {
  products: ProductRepository;
  productStoreLinks: ProductStoreLinkRepository;
  productFieldPolicies: ProductFieldPolicyRepository;
};

export function resolveProductView(
  deps: ResolveProductViewDeps,
  productId: string,
): ResolvedProductView | null {
  const product = deps.products.findById(productId);
  if (!product) {
    return null;
  }

  const links = deps.productStoreLinks.listByProduct(product.id);
  const primaryLink = links[0] ?? null;
  const globalPolicies = primaryLink
    ? deps.productFieldPolicies.listGlobal(primaryLink.storeConnectionId)
    : [];
  const productPolicies = primaryLink
    ? deps.productFieldPolicies.listForProduct(primaryLink.storeConnectionId, product.id)
    : [];

  return resolveProductFields({
    product,
    snapshot: primaryLink?.snapshot ?? null,
    globalPolicies,
    productPolicies,
  });
}

export function resolveProductViewBySlug(
  deps: ResolveProductViewDeps,
  slug: string,
): ResolvedProductView | null {
  const product = deps.products.findBySlug(slug);
  if (!product) {
    return null;
  }
  return resolveProductView(deps, product.id);
}

export function searchResolvedProducts(
  deps: ResolveProductViewDeps,
  query: string,
  options: { limit?: number; activeOnly?: boolean } = {},
): ResolvedProductView[] {
  const limit = options.limit ?? 10;
  const activeOnly = options.activeOnly !== false;
  const normalized = query.trim().toLowerCase();
  const products = deps.products.list(activeOnly);

  const scored = products
    .map((product) => {
      const view = resolveProductView(deps, product.id);
      if (!view) {
        return null;
      }
      if (!normalized) {
        return { view, score: 0 };
      }

      const haystack = [
        view.name,
        view.slug,
        view.shortDescription,
        view.longDescription,
        view.sku ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const score = haystack.includes(normalized) ? 1 : 0;
      return { view, score };
    })
    .filter((entry): entry is { view: ResolvedProductView; score: number } => entry !== null)
    .filter((entry) => (normalized ? entry.score > 0 : true))
    .slice(0, limit);

  return scored.map((entry) => entry.view);
}
