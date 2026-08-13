import type { FieldSource, ProductFieldKey } from "@/lib/types";

export const PRODUCT_FIELD_KEYS: ProductFieldKey[] = [
  "name",
  "short_description",
  "long_description",
  "price",
  "url",
  "image_url",
  "sku",
];

export const PRODUCT_FIELD_LABELS: Record<ProductFieldKey, string> = {
  name: "Nome",
  short_description: "Descrição curta",
  long_description: "Descrição longa",
  price: "Preço",
  url: "URL",
  image_url: "Imagem",
  sku: "SKU",
};

export const FIELD_SOURCE_LABELS: Record<FieldSource, string> = {
  iris: "Iris",
  store: "Loja",
  disabled: "Desativado",
};
