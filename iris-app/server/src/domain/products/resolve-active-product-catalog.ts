import type { ProductFieldPolicyRepository } from "../../ports/product-field-policy-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import { resolveProductFields } from "../products/product-field-resolver.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";

export type ProductCatalogResolverDeps = {
  products: ProductRepository;
  productStoreLinks: ProductStoreLinkRepository;
  productFieldPolicies: ProductFieldPolicyRepository;
};

export function resolveActiveProductCatalog(
  deps: ProductCatalogResolverDeps,
  activeOnly = true,
): ResolvedProductView[] {
  const products = deps.products.list(activeOnly);

  return products.map((product) => {
    const links = deps.productStoreLinks.listByProduct(product.id);
    const primaryLink = links[0] ?? null;

    const globalPolicies = primaryLink
      ? deps.productFieldPolicies.listGlobal(primaryLink.storeConnectionId)
      : [];
    const productPolicies = primaryLink
      ? deps.productFieldPolicies.listForProduct(
          primaryLink.storeConnectionId,
          product.id,
        )
      : [];

    return resolveProductFields({
      product,
      snapshot: primaryLink?.snapshot ?? null,
      globalPolicies,
      productPolicies,
    });
  });
}
