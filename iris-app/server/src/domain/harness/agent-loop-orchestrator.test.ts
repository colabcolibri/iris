import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "../../adapters/sqlite/product-field-policy-repository.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";
import { runAgentLoop } from "./agent-loop-orchestrator.ts";
import {
  createDefaultHarnessToolRegistry,
  createHarnessToolContext,
} from "./bootstrap-harness-tools.ts";
import { DEFAULT_HARNESS_BUDGET } from "./types.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";

function baseContext(): MessageReplyContext {
  return {
    persona: defaultReplyPersona(),
    conversation: { participantUsername: "user", replyPrompt: null },
    thread: {
      entries: [
        { direction: "inbound", text: "Quanto custa a camiseta?", authorUsername: "user" },
      ],
    },
    products: [],
    brandUsername: "marca",
    targetMessage: { text: "Quanto custa a camiseta?", authorUsername: "user" },
  };
}

describe("agent loop orchestrator", () => {
  test("finishes on first turn with action finish", async () => {
    let calls = 0;
    const llm = {
      async complete() {
        calls += 1;
        return createTestLlmCompletion(
          JSON.stringify({ action: "finish", text: "A camiseta custa R$ 99." }),
        );
      },
    };

    const db = new DatabaseSync(":memory:");
    runMigrations(db);
    const products = createSqliteProductRepository(db);
    products.create({ slug: "camiseta", name: "Camiseta", active: true });

    const toolContext = createHarnessToolContext(
      {
        products,
        productStoreLinks: createSqliteProductStoreLinkRepository(db),
        productFieldPolicies: createSqliteProductFieldPolicyRepository(db),
        storeConnections: {
          findById: () => null,
          list: () => [],
          create: () => {
            throw new Error("n/a");
          },
          update: () => null,
          remove: () => false,
          getCredentials: () => null,
        },
        storeProviders: { get: () => { throw new Error("n/a"); } },
      },
      DEFAULT_HARNESS_BUDGET,
    );

    const result = await runAgentLoop({
      context: baseContext(),
      agentContent: {
        dmSoul: "",
        dmPage: "",
        dmKnowledge: "",
        dmRestrictions: "",
        updatedAt: new Date().toISOString(),
      },
      llm,
      registry: createDefaultHarnessToolRegistry(),
      toolContext,
      budget: DEFAULT_HARNESS_BUDGET,
      maxChars: 200,
      messageCategory: "product_inquiry",
      focusProductSlug: null,
    });

    assert.equal(calls, 1);
    assert.equal(result.terminalStatus, "finished");
    assert.equal(result.finalText, "A camiseta custa R$ 99.");
  });
});
