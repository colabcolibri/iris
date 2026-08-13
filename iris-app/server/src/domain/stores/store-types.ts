export const STORE_PROVIDER_TYPES = ["yampi", "shopify", "woocommerce"] as const;

export type StoreProviderType = (typeof STORE_PROVIDER_TYPES)[number];

export type StoreConnectionStatus = "active" | "error" | "disconnected";

export type YampiCredentials = {
  alias: string;
  userToken: string;
  userSecretKey: string;
};

export type StoreCredentials = {
  providerType: "yampi";
  yampi: YampiCredentials;
};

export type ExternalProduct = {
  externalId: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  price: string | null;
  url: string | null;
  imageUrl: string | null;
  sku: string | null;
  raw: Record<string, unknown>;
};

export type ExternalProductPage = {
  items: ExternalProduct[];
  page: number;
  perPage: number;
  hasMore: boolean;
};

export type StoreConnectionTestResult = {
  ok: boolean;
  message: string;
};
