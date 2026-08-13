import type {
  FieldSource,
  ProductFieldKey,
  ProductFieldPolicy,
} from "../domain/products/product-field-keys.ts";

export type UpsertFieldPolicyInput = {
  scope: "global" | "product";
  storeConnectionId: string;
  productId?: string | null;
  fieldKey: ProductFieldKey;
  source: FieldSource;
};

export type ProductFieldPolicyRepository = {
  listGlobal(storeConnectionId: string): ProductFieldPolicy[];
  listForProduct(storeConnectionId: string, productId: string): ProductFieldPolicy[];
  upsert(input: UpsertFieldPolicyInput): ProductFieldPolicy;
  remove(id: string): boolean;
};
