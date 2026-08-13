import type { Product } from "./product.ts";
import {
  PRODUCT_FIELD_KEYS,
  type FieldSource,
  type ProductFieldKey,
  type ProductFieldPolicy,
} from "./product-field-keys.ts";
import type { ExternalProduct } from "../stores/store-types.ts";
import type { ResolvedProductView } from "./resolved-product-view.ts";

export type ResolveProductFieldsInput = {
  product: Product;
  snapshot: ExternalProduct | null;
  globalPolicies: ProductFieldPolicy[];
  productPolicies: ProductFieldPolicy[];
};

function defaultSource(fieldKey: ProductFieldKey, hasSnapshot: boolean): FieldSource {
  if (fieldKey === "price" || fieldKey === "url" || fieldKey === "image_url" || fieldKey === "sku") {
    return hasSnapshot ? "store" : "iris";
  }
  return "iris";
}

function resolveEffectiveSource(
  fieldKey: ProductFieldKey,
  input: ResolveProductFieldsInput,
): FieldSource {
  const productPolicy = input.productPolicies.find((policy) => policy.fieldKey === fieldKey);
  if (productPolicy) {
    return productPolicy.source;
  }

  const globalPolicy = input.globalPolicies.find((policy) => policy.fieldKey === fieldKey);
  if (globalPolicy) {
    return globalPolicy.source;
  }

  return defaultSource(fieldKey, input.snapshot !== null);
}

function readIrisValue(product: Product, fieldKey: ProductFieldKey): string | null {
  switch (fieldKey) {
    case "name":
      return product.name;
    case "short_description":
      return product.shortDescription || null;
    case "long_description":
      return product.longDescription || null;
    default:
      return null;
  }
}

function readStoreValue(snapshot: ExternalProduct, fieldKey: ProductFieldKey): string | null {
  switch (fieldKey) {
    case "name":
      return snapshot.name || null;
    case "short_description":
      return snapshot.shortDescription || null;
    case "long_description":
      return snapshot.longDescription || null;
    case "price":
      return snapshot.price;
    case "url":
      return snapshot.url;
    case "image_url":
      return snapshot.imageUrl;
    case "sku":
      return snapshot.sku;
    default:
      return null;
  }
}

function resolveFieldValue(
  fieldKey: ProductFieldKey,
  source: FieldSource,
  product: Product,
  snapshot: ExternalProduct | null,
): string | null {
  if (source === "disabled") {
    return null;
  }

  if (source === "store") {
    if (!snapshot) {
      return readIrisValue(product, fieldKey);
    }
    return readStoreValue(snapshot, fieldKey);
  }

  return readIrisValue(product, fieldKey);
}

export function resolveProductFields(input: ResolveProductFieldsInput): ResolvedProductView {
  const fieldSources = {} as Record<ProductFieldKey, FieldSource>;
  const values: Record<ProductFieldKey, string | null> = {} as Record<
    ProductFieldKey,
    string | null
  >;

  for (const fieldKey of PRODUCT_FIELD_KEYS) {
    const source = resolveEffectiveSource(fieldKey, input);
    fieldSources[fieldKey] = source;
    values[fieldKey] = resolveFieldValue(fieldKey, source, input.product, input.snapshot);
  }

  return {
    productId: input.product.id,
    slug: input.product.slug,
    name: values.name ?? "",
    shortDescription: values.short_description ?? "",
    longDescription: values.long_description ?? "",
    price: values.price,
    url: values.url,
    imageUrl: values.image_url,
    sku: values.sku,
    fieldSources,
  };
}

export function formatResolvedProductForPrompt(view: ResolvedProductView): string {
  const lines = [`- ${view.slug}: ${view.name}`];

  if (view.shortDescription) {
    lines.push(`  resumo: ${view.shortDescription}`);
  }
  if (view.longDescription) {
    lines.push(`  detalhes: ${view.longDescription}`);
  }
  if (view.price) {
    lines.push(`  preço: ${view.price}`);
  }
  if (view.url) {
    lines.push(`  link: ${view.url}`);
  }
  if (view.sku) {
    lines.push(`  sku: ${view.sku}`);
  }

  return lines.join("\n");
}
