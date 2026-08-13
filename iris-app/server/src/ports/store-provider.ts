import type {
  ExternalProduct,
  ExternalProductPage,
  StoreConnectionTestResult,
  StoreCredentials,
  StoreProviderType,
} from "../domain/stores/store-types.ts";

export type StoreProvider = {
  readonly providerType: StoreProviderType;
  testConnection(credentials: StoreCredentials): Promise<StoreConnectionTestResult>;
  listExternalProducts(
    credentials: StoreCredentials,
    options?: { page?: number; perPage?: number },
  ): Promise<ExternalProductPage>;
  getExternalProduct(
    credentials: StoreCredentials,
    externalProductId: string,
  ): Promise<ExternalProduct | null>;
};
