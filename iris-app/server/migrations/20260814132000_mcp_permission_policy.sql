CREATE TABLE IF NOT EXISTS mcp_permission_settings (
  id TEXT PRIMARY KEY NOT NULL,
  preset TEXT NOT NULL DEFAULT 'full',
  domain_overrides_json TEXT,
  updated_at TEXT NOT NULL
);
