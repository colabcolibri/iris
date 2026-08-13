export const PRODUCT_FIELD_KEYS = [
  "name",
  "short_description",
  "long_description",
  "price",
  "url",
  "image_url",
  "sku",
] as const;

export type ProductFieldKey = (typeof PRODUCT_FIELD_KEYS)[number];

export type FieldSource = "iris" | "store" | "disabled";

export type ProductFieldPolicy = {
  id: string;
  scope: "global" | "product";
  storeConnectionId: string;
  productId: string | null;
  fieldKey: ProductFieldKey;
  source: FieldSource;
  createdAt: string;
  updatedAt: string;
};

export function isProductFieldKey(value: string): value is ProductFieldKey {
  return (PRODUCT_FIELD_KEYS as readonly string[]).includes(value);
}
