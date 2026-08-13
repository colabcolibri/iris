import type { ExternalProduct } from "./store-types.ts";

export type ProductStoreLink = {
  id: string;
  productId: string;
  storeConnectionId: string;
  externalProductId: string;
  externalSku: string | null;
  snapshot: ExternalProduct;
  linkedAt: string;
  updatedAt: string;
};
