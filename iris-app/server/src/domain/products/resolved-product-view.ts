import type { FieldSource, ProductFieldKey } from "./product-field-keys.ts";

export type ResolvedProductView = {
  productId: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  price: string | null;
  url: string | null;
  imageUrl: string | null;
  sku: string | null;
  fieldSources: Record<ProductFieldKey, FieldSource>;
};
