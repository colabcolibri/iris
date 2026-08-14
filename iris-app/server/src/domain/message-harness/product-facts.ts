import type { ResolvedProductView } from "../products/resolved-product-view.ts";
import { formatResolvedProductForPrompt } from "../products/product-field-resolver.ts";

export function formatProductFactsForVerify(products: ResolvedProductView[]): string {
  if (products.length === 0) {
    return "(nenhum produto consultado via tools)";
  }

  return products
    .map((product, index) => `Produto ${index + 1}:\n${formatResolvedProductForPrompt(product)}`)
    .join("\n\n");
}

export function buildProductFactsBlock(draftText: string, products: ResolvedProductView[]): string {
  const cited = products.filter((product) => {
    const haystack = draftText.toLowerCase();
    return (
      haystack.includes(product.name.toLowerCase()) ||
      haystack.includes(product.slug.toLowerCase()) ||
      (product.price ? haystack.includes(product.price.toLowerCase()) : false)
    );
  });

  const relevant = cited.length > 0 ? cited : products;
  return formatProductFactsForVerify(relevant);
}
