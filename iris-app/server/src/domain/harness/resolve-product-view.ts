import type { ProductFieldPolicyRepository } from "../../ports/product-field-policy-repository.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import { resolveProductFields } from "../products/product-field-resolver.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";
import { searchProductCatalog } from "../products/product-catalog-search.ts";

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
  return searchProductCatalog(deps, query, options).items;
}
