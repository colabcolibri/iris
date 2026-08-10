CREATE TABLE IF NOT EXISTS mcp_connection_settings (
  id TEXT PRIMARY KEY NOT NULL,
  code_hash TEXT NOT NULL,
  code_hint TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
