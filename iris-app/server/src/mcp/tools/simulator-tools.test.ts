import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import { createHarnessLlmMock } from "../../test-utils/harness-llm-mock.ts";
import { createIrisMcpServer } from "../create-iris-mcp-server.ts";

function parseToolJson(result: { content?: unknown; isError?: boolean }) {
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  const block = result.content?.[0];
  assert.ok(block && typeof block === "object" && "text" in block);
  return JSON.parse(String(block.text)) as Record<string, unknown>;
}

async function createMcpClient(options?: { llm?: LlmCompleter | null }) {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-simulator-"));
  const db = openDatabase(":memory:");
  runMigrations(db);

  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  if (options?.llm !== undefined) {
    (ctx as { resolveLlmCompleter: () => LlmCompleter | null }).resolveLlmCompleter = () =>
      options.llm ?? null;
  }

  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    server,
    db,
    mediaRoot,
    async close() {
      await client.close();
      await server.close();
      db.close();
      await rm(mediaRoot, { recursive: true, force: true });
    },
  };
}

test("MCP simulator tools list seeded scenarios without full thread", async () => {
  const harness = await createMcpClient();

  try {
    const tools = await harness.client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    assert.ok(toolNames.includes("iris_list_simulator_scenarios"));
    assert.ok(toolNames.includes("iris_create_simulator_scenario"));
    assert.ok(toolNames.includes("iris_simulate_reply"));

    const result = await harness.client.callTool({
      name: "iris_list_simulator_scenarios",
      arguments: {},
    });

    const body = parseToolJson(result) as {
      items: Array<Record<string, unknown>>;
    };
    const scenario = body.items.find((item) => item.id === "lookbook-verao");
    assert.ok(scenario);
    assert.equal(typeof scenario!.label, "string");
    assert.equal(typeof scenario!.description, "string");
    assert.equal(typeof scenario!.caption_preview, "string");
    assert.equal(typeof scenario!.carousel_summary_preview, "string");
    assert.equal(typeof scenario!.thread_message_count, "number");
    assert.equal("thread" in scenario!, false);
    assert.equal("target_text" in scenario!, false);
  } finally {
    await harness.close();
  }
});

test("MCP simulator tools create scenario with REST-equivalent validation", async () => {
  const harness = await createMcpClient();

  try {
    const createResult = await harness.client.callTool({
      name: "iris_create_simulator_scenario",
      arguments: {
        id: "mcp-created",
        label: "MCP created",
        description: "Created via MCP",
        caption: "Caption",
        carousel_summary: "Carousel",
        thread: [{ author: "user", text: "Hi" }],
        target_author: "guest",
        target_text: "Question?",
      },
    });

    const created = parseToolJson(createResult) as { id: string; target_text: string };
    assert.equal(created.id, "mcp-created");
    assert.equal(created.target_text, "Question?");

    const listResult = await harness.client.callTool({
      name: "iris_list_simulator_scenarios",
      arguments: {},
    });
    const listBody = parseToolJson(listResult) as { items: Array<{ id: string }> };
    assert.ok(listBody.items.some((item) => item.id === "mcp-created"));
  } finally {
    await harness.close();
  }
});

test("MCP simulator tools simulate by scenario_id returns harness result", async () => {
  const harness = await createMcpClient({
    llm: createHarnessLlmMock({ draftText: "Resposta simulada via MCP" }),
  });

  try {
    const result = await harness.client.callTool({
      name: "iris_simulate_reply",
      arguments: { scenario_id: "lookbook-verao" },
    });

    const body = parseToolJson(result) as {
      final_text: string | null;
      terminal_status: string;
      reply_tier: string;
      response_language: string;
      audit: Record<string, unknown>;
    };

    assert.equal(body.final_text, "Resposta simulada via MCP");
    assert.equal(typeof body.terminal_status, "string");
    assert.equal(typeof body.reply_tier, "string");
    assert.equal(typeof body.response_language, "string");
    assert.ok(body.audit && typeof body.audit === "object");
    assert.equal(body.audit.trigger, "simulate");
  } finally {
    await harness.close();
  }
});

test("MCP simulator tools simulate accepts response_language override", async () => {
  const harness = await createMcpClient({
    llm: createHarnessLlmMock({ draftText: "Olá em português" }),
  });

  try {
    const result = await harness.client.callTool({
      name: "iris_simulate_reply",
      arguments: {
        scenario_id: "lookbook-verao",
        response_language: "pt-BR",
      },
    });

    const body = parseToolJson(result) as { response_language: string; final_text: string | null };
    assert.equal(body.response_language, "pt-BR");
    assert.equal(body.final_text, "Olá em português");
  } finally {
    await harness.close();
  }
});

test("MCP simulator tools simulate rejects missing LLM configuration", async () => {
  const harness = await createMcpClient({ llm: null });

  try {
    const result = await harness.client.callTool({
      name: "iris_simulate_reply",
      arguments: { scenario_id: "lookbook-verao" },
    });

    assert.equal(result.isError, true);
    const errorText = result.content?.[0];
    assert.ok(errorText && "text" in errorText);
    assert.match(String(errorText.text), /LLM is not configured/);
  } finally {
    await harness.close();
  }
});
