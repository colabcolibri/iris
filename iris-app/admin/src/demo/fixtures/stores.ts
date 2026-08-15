import type { ProductFieldPolicy, StoreConnection } from "@/lib/types";

const now = "2026-08-01T12:00:00.000Z";

export const DEMO_STORE_CONNECTIONS: StoreConnection[] = [
  {
    id: "demo-store-1",
    provider_type: "yampi",
    label: "Main store",
    status: "active",
    settings: {},
    yampi_alias: "estudionomade",
    has_credentials: true,
    last_sync_at: "2026-08-12T14:30:00.000Z",
    last_error: null,
    created_at: now,
    updated_at: now,
  },
];

export const DEMO_STORE_FIELD_POLICIES: ProductFieldPolicy[] = [
  { field_key: "name", source: "store" },
  { field_key: "short_description", source: "iris" },
  { field_key: "long_description", source: "iris" },
  { field_key: "price", source: "store" },
  { field_key: "url", source: "store" },
  { field_key: "image_url", source: "store" },
  { field_key: "sku", source: "disabled" },
];
