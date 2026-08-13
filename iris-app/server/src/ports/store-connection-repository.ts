import type {
  StoreConnection,
  StoreConnectionStatus,
} from "../domain/stores/store-connection.ts";
import type {
  StoreCredentials,
  StoreProviderType,
} from "../domain/stores/store-types.ts";

export type CreateStoreConnectionInput = {
  providerType: StoreProviderType;
  label: string;
  credentials: StoreCredentials;
  settings?: Record<string, unknown>;
  status?: StoreConnectionStatus;
};

export type UpdateStoreConnectionInput = {
  label?: string;
  credentials?: StoreCredentials;
  settings?: Record<string, unknown>;
  status?: StoreConnectionStatus;
  lastSyncAt?: string | null;
  lastError?: string | null;
};

export type StoreConnectionRecord = StoreConnection & {
  hasCredentials: boolean;
};

export type StoreConnectionRepository = {
  list(): StoreConnectionRecord[];
  findById(id: string): StoreConnectionRecord | null;
  getCredentials(id: string): StoreCredentials | null;
  create(input: CreateStoreConnectionInput): StoreConnectionRecord;
  update(id: string, input: UpdateStoreConnectionInput): StoreConnectionRecord | null;
  remove(id: string): boolean;
};
