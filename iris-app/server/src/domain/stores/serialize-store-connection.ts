import type { StoreConnectionRecord } from "../../ports/store-connection-repository.ts";

export function serializeStoreConnection(connection: StoreConnectionRecord) {
  return {
    id: connection.id,
    provider_type: connection.providerType,
    label: connection.label,
    status: connection.status,
    settings: connection.settings,
    has_credentials: connection.hasCredentials,
    last_sync_at: connection.lastSyncAt,
    last_error: connection.lastError,
    created_at: connection.createdAt,
    updated_at: connection.updatedAt,
  };
}
