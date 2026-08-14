import type { AppContext } from "../../api/app-context.ts";
import {
  createDefaultHarnessToolRegistry,
  createHarnessToolContext,
} from "../harness/bootstrap-harness-tools.ts";
import { DEFAULT_HARNESS_BUDGET } from "../harness/types.ts";
import type { MessageAgenticDraftDeps } from "../message-harness/agentic-draft-stage.ts";

export type MessageHarnessCatalogDeps = {
  products: AppContext["products"];
  productStoreLinks: AppContext["productStoreLinks"];
  productFieldPolicies: AppContext["productFieldPolicies"];
  storeConnections: AppContext["storeConnections"];
  storeProviders: AppContext["storeProviders"];
};

export function createMessageHarnessDeps(
  ctx: MessageHarnessCatalogDeps,
): MessageAgenticDraftDeps {
  return {
    registry: createDefaultHarnessToolRegistry(),
    toolContext: createHarnessToolContext(
      {
        products: ctx.products,
        productStoreLinks: ctx.productStoreLinks,
        productFieldPolicies: ctx.productFieldPolicies,
        storeConnections: ctx.storeConnections,
        storeProviders: ctx.storeProviders,
      },
      DEFAULT_HARNESS_BUDGET,
    ),
  };
}
