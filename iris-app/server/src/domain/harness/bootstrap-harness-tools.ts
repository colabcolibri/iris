import type { HarnessToolContext } from "../../ports/harness-tool.ts";
import { HarnessToolRegistry } from "./harness-tool-registry.ts";
import type { HarnessBudget } from "./types.ts";
import { createCatalogGetProductTool } from "./tools/catalog-get-product.ts";
import { createCatalogRefreshStoreSnapshotTool } from "./tools/catalog-refresh-store-snapshot.ts";
import { createCatalogSearchProductsTool } from "./tools/catalog-search-products.ts";
import { createFinishDraftTool } from "./tools/finish-draft.ts";
import { createNotifyOperatorTool } from "./tools/notify-operator.ts";

export function createDefaultHarnessToolRegistry(): HarnessToolRegistry {
  const registry = new HarnessToolRegistry();
  registry.registerAll([
    createCatalogSearchProductsTool(),
    createCatalogGetProductTool(),
    createCatalogRefreshStoreSnapshotTool(),
    createFinishDraftTool(),
    createNotifyOperatorTool(),
  ]);
  return registry;
}

export function createHarnessToolContext(
  base: Omit<HarnessToolContext, "budget" | "refreshCount">,
  budget: HarnessBudget,
): HarnessToolContext {
  return {
    ...base,
    budget,
    refreshCount: 0,
  };
}
