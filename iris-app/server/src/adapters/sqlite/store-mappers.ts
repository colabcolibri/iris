import type { ProductFieldPolicy } from "../../domain/products/product-field-keys.ts";
import type { ProductStoreLink } from "../../domain/stores/product-store-link.ts";
import type { StoreConnection } from "../../domain/stores/store-connection.ts";
import type { ExternalProduct, StoreProviderType } from "../../domain/stores/store-types.ts";

type StoreConnectionRow = {
  id: string;
  provider_type: string;
  label: string;
  status: string;
  settings_json: string;
  encrypted_credentials: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type ProductStoreLinkRow = {
  id: string;
  product_id: string;
  store_connection_id: string;
  external_product_id: string;
  external_sku: string | null;
  provider_snapshot_json: string;
  linked_at: string;
  updated_at: string;
};

type ProductFieldPolicyRow = {
  id: string;
  scope: string;
  store_connection_id: string;
  product_id: string | null;
  field_key: string;
  source: string;
  created_at: string;
  updated_at: string;
};

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
}

export function mapStoreConnectionRow(
  row: StoreConnectionRow,
): StoreConnection & { hasCredentials: boolean } {
  return {
    id: row.id,
    providerType: row.provider_type as StoreProviderType,
    label: row.label,
    status: row.status as StoreConnection["status"],
    settings: parseJsonObject(row.settings_json),
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hasCredentials: Boolean(row.encrypted_credentials),
  };
}

export function mapExternalProductSnapshot(raw: string): ExternalProduct {
  const parsed = JSON.parse(raw) as ExternalProduct;
  return {
    externalId: parsed.externalId,
    name: parsed.name ?? "",
    shortDescription: parsed.shortDescription ?? "",
    longDescription: parsed.longDescription ?? "",
    price: parsed.price ?? null,
    url: parsed.url ?? null,
    imageUrl: parsed.imageUrl ?? null,
    sku: parsed.sku ?? null,
    raw: parsed.raw ?? {},
  };
}

export function mapProductStoreLinkRow(row: ProductStoreLinkRow): ProductStoreLink {
  return {
    id: row.id,
    productId: row.product_id,
    storeConnectionId: row.store_connection_id,
    externalProductId: row.external_product_id,
    externalSku: row.external_sku,
    snapshot: mapExternalProductSnapshot(row.provider_snapshot_json),
    linkedAt: row.linked_at,
    updatedAt: row.updated_at,
  };
}

export function mapProductFieldPolicyRow(row: ProductFieldPolicyRow): ProductFieldPolicy {
  return {
    id: row.id,
    scope: row.scope as ProductFieldPolicy["scope"],
    storeConnectionId: row.store_connection_id,
    productId: row.product_id,
    fieldKey: row.field_key as ProductFieldPolicy["fieldKey"],
    source: row.source as ProductFieldPolicy["source"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function serializeExternalProduct(snapshot: ExternalProduct): string {
  return JSON.stringify(snapshot);
}
