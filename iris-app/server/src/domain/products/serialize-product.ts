import type { Product } from "../../domain/products/product.ts";

export function serializeProduct(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    short_description: product.shortDescription,
    long_description: product.longDescription,
    active: product.active,
    sort_order: product.sortOrder,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}
