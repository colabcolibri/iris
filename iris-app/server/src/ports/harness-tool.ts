import type { StoreConnectionRepository } from "./store-connection-repository.ts";
import type { StoreProviderRegistry } from "../domain/stores/store-provider-registry.ts";
import type { ProductFieldPolicyRepository } from "./product-field-policy-repository.ts";
import type { ProductRepository } from "./product-repository.ts";
import type { ProductStoreLinkRepository } from "./product-store-link-repository.ts";
import type { HarnessBudget } from "../domain/harness/types.ts";

export type HarnessToolContext = {
  products: ProductRepository;
  productStoreLinks: ProductStoreLinkRepository;
  productFieldPolicies: ProductFieldPolicyRepository;
  storeConnections: StoreConnectionRepository;
  storeProviders: StoreProviderRegistry;
  budget: HarnessBudget;
  refreshCount: number;
};

export type HarnessToolResult = {
  success: boolean;
  output: unknown;
  errorCode?: string;
};

export type HarnessTool = {
  readonly name: string;
  readonly description: string;
  execute(ctx: HarnessToolContext, args: Record<string, unknown>): Promise<HarnessToolResult>;
};
