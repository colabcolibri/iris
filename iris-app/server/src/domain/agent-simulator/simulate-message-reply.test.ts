import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "../../adapters/sqlite/product-field-policy-repository.ts";
import { createSqliteAgentRunRepository } from "../../adapters/sqlite/agent-run-repository.ts";
import { createSqliteAgentRunStepRepository } from "../../adapters/sqlite/agent-run-step-repository.ts";
import { createSqliteReplyPersonaStore } from "../../adapters/sqlite/reply-persona-repository.ts";
import { createSqliteMessageAgentContentStore } from "../../adapters/sqlite/message-agent-content-repository.ts";
import { createLoggingEmailSender } from "../../adapters/email/logging-email-sender.ts";
import { createSqliteOperatorNotificationLogRepository } from "../../adapters/sqlite/operator-notification-log-repository.ts";
import { createSqliteOperatorNotificationSettingsStore } from "../../adapters/sqlite/operator-notification-settings-repository.ts";
import { createSqliteAppSettingsStore } from "../../adapters/sqlite/app-settings-repository.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";
import { simulateMessageReply } from "./simulate-message-reply.ts";

describe("simulateMessageReply", () => {
  test("runs agentic message harness and records tool-capable audit", async () => {
    let call = 0;
    const llm = {
      async complete(prompt: string) {
        call += 1;
        if (prompt.includes("Instagram DM triage stage")) {
          return createTestLlmCompletion(
            JSON.stringify({
              messageCategory: "product_inquiry",
              productSlug: null,
              shouldReply: true,
              reason: "product",
              reasoning: "pergunta de produto",
            }),
          );
        }
        if (prompt.includes("Instagram DM replies using catalog tools")) {
          return createTestLlmCompletion(
            JSON.stringify({ action: "finish", text: "O vestido custa R$ 99." }),
          );
        }
        return createTestLlmCompletion(
          JSON.stringify({
            approved: true,
            harmful: false,
            policyViolations: [],
            reason: "ok",
            reasoning: "ok",
            finalText: "O vestido custa R$ 99.",
          }),
        );
      },
    };

    const db = openDatabase(":memory:");
    try {
      runMigrations(db);
      const products = createSqliteProductRepository(db);
      products.create({ slug: "vestido", name: "Vestido", active: true });

      const result = await simulateMessageReply(
        {
          target_message: { author: "user", text: "Quanto custa o vestido?" },
          thread: [],
        },
        {
          personaStore: createSqliteReplyPersonaStore(db),
          messageAgentContentStore: createSqliteMessageAgentContentStore(db),
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
          emailSender: createLoggingEmailSender(),
          appSettingsStore: createSqliteAppSettingsStore(db),
          operatorNotificationSettingsStore: createSqliteOperatorNotificationSettingsStore(db),
          operatorNotificationLogRepository: createSqliteOperatorNotificationLogRepository(db),
          publicBaseUrl: null,
          llm,
          agentRuns: createSqliteAgentRunRepository(db),
          agentRunSteps: createSqliteAgentRunStepRepository(db),
        },
      );

      assert.ok(call >= 3);
      assert.equal(result.terminal_status, "approved");
      assert.equal(result.final_text, "O vestido custa R$ 99.");
      assert.ok(result.audit.steps.some((step) => step.stage === "message_triage"));
      assert.ok(result.audit.steps.some((step) => step.stage === "message_verify"));
    } finally {
      db.close();
    }
  });
});
