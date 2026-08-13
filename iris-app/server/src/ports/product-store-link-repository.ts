import type { ProductStoreLink } from "../domain/stores/product-store-link.ts";
import type { ExternalProduct } from "../domain/stores/store-types.ts";

export type CreateProductStoreLinkInput = {
  productId: string;
  storeConnectionId: string;
  externalProductId: string;
  externalSku?: string | null;
  snapshot: ExternalProduct;
};

export type ProductStoreLinkRepository = {
  listByProduct(productId: string): ProductStoreLink[];
  listByStoreConnection(storeConnectionId: string): ProductStoreLink[];
  findById(id: string): ProductStoreLink | null;
  findByExternalId(
    storeConnectionId: string,
    externalProductId: string,
  ): ProductStoreLink | null;
  upsert(input: CreateProductStoreLinkInput): ProductStoreLink;
  remove(id: string): boolean;
};
