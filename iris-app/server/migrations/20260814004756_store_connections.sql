CREATE TABLE IF NOT EXISTS store_connections (
  id TEXT PRIMARY KEY,
  provider_type TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  settings_json TEXT NOT NULL DEFAULT '{}',
  encrypted_credentials TEXT,
  last_sync_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_connections_provider
  ON store_connections(provider_type);

CREATE TABLE IF NOT EXISTS product_store_links (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  store_connection_id TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  external_sku TEXT,
  provider_snapshot_json TEXT NOT NULL DEFAULT '{}',
  linked_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (store_connection_id) REFERENCES store_connections(id) ON DELETE CASCADE,
  UNIQUE (store_connection_id, external_product_id),
  UNIQUE (product_id, store_connection_id)
);

CREATE INDEX IF NOT EXISTS idx_product_store_links_product
  ON product_store_links(product_id);

CREATE TABLE IF NOT EXISTS product_field_policies (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'product')),
  store_connection_id TEXT NOT NULL,
  product_id TEXT,
  field_key TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('iris', 'store', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (store_connection_id) REFERENCES store_connections(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (store_connection_id, scope, product_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_product_field_policies_lookup
  ON product_field_policies(store_connection_id, product_id);
