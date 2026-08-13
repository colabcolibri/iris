import type { StoreConnectionStatus, StoreProviderType } from "./store-types.ts";

export type StoreConnection = {
  id: string;
  providerType: StoreProviderType;
  label: string;
  status: StoreConnectionStatus;
  settings: Record<string, unknown>;
  lastSyncAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};
