import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteProductRepository } from "../../adapters/sqlite/product-repository.ts";
import { createSqliteProductStoreLinkRepository } from "../../adapters/sqlite/product-store-link-repository.ts";
import { createSqliteProductFieldPolicyRepository } from "../../adapters/sqlite/product-field-policy-repository.ts";
import { createTestLlmCompletion } from "../../ports/llm-completer.ts";
import { finalizeAgentPrompt } from "../reply-harness/agent-prompt.ts";
import { runAgentLoop, parseAgentLoopTurnAction, buildAgentLoopPrompt, type RunAgentLoopInput } from "./agent-loop-orchestrator.ts";
import {
  createAgentLoopTranscript,
} from "./agent-loop-transcript.ts";
import {
  createDefaultHarnessToolRegistry,
  createHarnessToolContext,
} from "./bootstrap-harness-tools.ts";
import { DEFAULT_HARNESS_BUDGET } from "./types.ts";
import { createLoggingEmailSender } from "../../adapters/email/logging-email-sender.ts";
import { createSqliteOperatorNotificationLogRepository } from "../../adapters/sqlite/operator-notification-log-repository.ts";
import { createSqliteOperatorNotificationSettingsStore } from "../../adapters/sqlite/operator-notification-settings-repository.ts";
import {
  OperatorNotificationService,
  createEmailOperatorNotificationChannel,
} from "../notifications/operator-notification-service.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { createStoreProviderRegistry } from "../stores/store-provider-registry.ts";

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

describe("parseAgentLoopTurnAction", () => {
  test("accepts notify_operator shorthand action", () => {
    const action = parseAgentLoopTurnAction(
      JSON.stringify({
        action: "notify_operator",
        arguments: { customerMessage: "Vou verificar internamente." },
      }),
    );

    assert.deepEqual(action, {
      action: "call_tool",
      tool: "notify_operator",
      arguments: { customerMessage: "Vou verificar internamente." },
    });
  });
});

describe("buildAgentLoopPrompt", () => {
  test("uses English instructions and explicit response language from persona", () => {
    const input: RunAgentLoopInput = {
      context: {
        ...baseContext(),
        persona: { ...defaultReplyPersona(), responseLanguage: "pt-BR" },
      },
      agentContent: {
        dmSoul: "",
        dmPage: "",
        dmKnowledge: "",
        dmRestrictions: "",
        updatedAt: new Date().toISOString(),
      },
      llm: { async complete() { return createTestLlmCompletion("{}"); } },
      registry: createDefaultHarnessToolRegistry(),
      toolContext: { budget: DEFAULT_HARNESS_BUDGET, refreshCount: 0 } as RunAgentLoopInput["toolContext"],
      budget: DEFAULT_HARNESS_BUDGET,
      maxChars: 200,
      messageCategory: "product_inquiry",
      focusProductSlug: null,
    };

    const prompt = finalizeAgentPrompt(
      buildAgentLoopPrompt(input, null, createAgentLoopTranscript()),
      input.context.persona,
      "agentLoopPublic",
    );

    assert.match(prompt, /You write Instagram DM replies/);
    assert.match(prompt, /Response language \(MANDATORY\)/);
    assert.match(prompt, /Brazilian Portuguese \(pt-BR\)/);
    assert.match(prompt, /finish\.text or notify_operator\.customerMessage/);
    assert.doesNotMatch(prompt, /Você redige/);
  });
});

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
        storeProviders: createStoreProviderRegistry(),
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

  test("feeds tool observations into the next LLM turn", async () => {
    const prompts: string[] = [];
    let calls = 0;
    const llm = {
      async complete(prompt: string) {
        prompts.push(prompt);
        calls += 1;
        if (calls === 1) {
          return createTestLlmCompletion(
            JSON.stringify({
              action: "call_tool",
              tool: "search_products",
              arguments: { query: "bolsa" },
            }),
          );
        }
        return createTestLlmCompletion(
          JSON.stringify({ action: "finish", text: "Não temos essa bolsa no catálogo." }),
        );
      },
    };

    const db = new DatabaseSync(":memory:");
    runMigrations(db);
    const products = createSqliteProductRepository(db);
    products.create({ slug: "jogo-grok", name: "Jogo Grok", active: true });

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
        storeProviders: createStoreProviderRegistry(),
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

    assert.equal(calls, 2);
    assert.match(prompts[1] ?? "", /observation \(search_products\)/);
    assert.equal(result.terminalStatus, "finished");
    assert.equal(result.finalText, "Não temos essa bolsa no catálogo.");
  });

  test("escalates when model uses notify_operator shorthand", async () => {
    const llm = {
      async complete() {
        return createTestLlmCompletion(
          JSON.stringify({
            action: "notify_operator",
            arguments: {
              reason: "Cliente com erro no checkout",
              customerSummary: "Não consegue finalizar a compra",
              customerMessage: "Vou escalar para nossa equipe verificar o checkout.",
            },
          }),
        );
      },
    };

    const db = new DatabaseSync(":memory:");
    runMigrations(db);
    const settingsStore = createSqliteOperatorNotificationSettingsStore(db);
    const logRepository = createSqliteOperatorNotificationLogRepository(db);
    settingsStore.upsert({
      channels: { email: { enabled: true, destination: "ops@example.com" } },
      aiLockDays: 5,
    });
    const notificationService = new OperatorNotificationService({
      settingsStore,
      logRepository,
      channels: [createEmailOperatorNotificationChannel(createLoggingEmailSender())],
    });

    const products = createSqliteProductRepository(db);
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
        storeProviders: createStoreProviderRegistry(),
        operatorNotification: {
          service: notificationService,
          context: {
            supportIntent: "purchase_difficulty",
            supportUrgency: "high",
            participantUsername: "user",
          },
        },
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
      messageCategory: "advice_help",
      focusProductSlug: null,
      triageHints: {
        supportIntent: "purchase_difficulty",
        supportUrgency: "high",
      },
    });

    assert.equal(result.terminalStatus, "escalated_operator");
    assert.match(result.finalText ?? "", /escalar/i);
    assert.equal(logRepository.listRecent(1)[0]?.status, "sent");
  });
});
