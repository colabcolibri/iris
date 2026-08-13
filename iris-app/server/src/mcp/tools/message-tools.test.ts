import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createAppContext } from "../../api/app-context.ts";
import { createIrisMcpServer } from "../create-iris-mcp-server.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

async function createMcpClient(ctx: ReturnType<typeof createAppContext>) {
  const server = createIrisMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

test("iris_list_conversations returns empty inbox", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-messages-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const { client, server } = await createMcpClient(ctx);
  const result = await client.callTool({
    name: "iris_list_conversations",
    arguments: {},
  });

  assert.notEqual(result.isError, true);
  const text = result.content?.[0];
  assert.equal(text?.type, "text");
  const payload = JSON.parse(String(text?.text));
  assert.deepEqual(payload.conversations, []);

  await client.close();
  await server.close();
  db.close();
  await rm(mediaRoot, { recursive: true, force: true });
});

test("iris_list_conversation_messages and iris_get_message_reply_context", async () => {
  const mediaRoot = await mkdtemp(join(tmpdir(), "iris-mcp-messages-"));
  const db = openDatabase(":memory:");
  runMigrations(db);
  const ctx = createAppContext({
    db,
    adminToken: "admin",
    agentToken: "agent",
    mediaRoot,
    mcpConnectionCode: "mcp-test",
  });

  const { conversation } = ctx.conversations.upsert({
    igConversationId: "t_conv_1",
    participantIgUserId: "user_1",
    participantUsername: "cliente.dm",
    lastMessageAt: new Date().toISOString(),
  });
  const { message } = ctx.messages.upsertInbound({
    igMessageId: "m_in_1",
    conversationId: conversation.id,
    text: "Tem o vestido P?",
    igTimestamp: new Date().toISOString(),
  });

  const { client, server } = await createMcpClient(ctx);

  const listResult = await client.callTool({
    name: "iris_list_conversation_messages",
    arguments: { conversationId: conversation.id },
  });
  assert.notEqual(listResult.isError, true);
  const listPayload = JSON.parse(String(listResult.content?.[0]?.text));
  assert.equal(listPayload.messages.length, 1);
  assert.equal(listPayload.messages[0].text, "Tem o vestido P?");

  const contextResult = await client.callTool({
    name: "iris_get_message_reply_context",
    arguments: { messageId: message.id },
  });
  assert.notEqual(contextResult.isError, true);
  const contextPayload = JSON.parse(String(contextResult.content?.[0]?.text));
  assert.equal(contextPayload.target_message.id, message.id);
  assert.equal(contextPayload.thread.length, 1);

  await client.close();
  await server.close();
  db.close();
  await rm(mediaRoot, { recursive: true, force: true });
});
