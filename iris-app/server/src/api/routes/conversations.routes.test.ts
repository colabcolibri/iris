import { test } from "node:test";
import assert from "node:assert/strict";
import { MetaMessageSendError } from "../../ports/meta-message-sender.ts";
import type { MetaConversationsReader } from "../../ports/meta-conversations-reader.ts";
import type { AppContext } from "../app-context.ts";
import { createServer } from "../http-server.ts";

const ADMIN = "conv-admin";

const EMPTY_MESSAGES_PAGE = { messages: [], after: null };

function isolateMetaNetwork(ctx: AppContext): void {
  const base = ctx.metaConversationsReader;
  const stub: MetaConversationsReader = {
    listConversations: (...args) => base.listConversations(...args),
    listMessages: async () => EMPTY_MESSAGES_PAGE,
    resolveParticipantProfile: async () => null,
    resolveMessagingRecipientFromIgMessage: async () => null,
  };
  ctx.metaConversationsReader = stub;
}

async function withServer(
  run: (baseUrl: string, ctx: AppContext) => Promise<void>,
): Promise<void> {
  const handle = createServer({
    dbPath: ":memory:",
    adminToken: ADMIN,
    metaAccessToken: "meta-token",
    igUserId: "ig-user",
    encryptionKey: "f".repeat(64),
  });

  isolateMetaNetwork(handle.ctx);

  await new Promise<void>((resolve) => {
    handle.server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = handle.server.address();
  const port =
    typeof address === "object" && address ? address.port : Number.NaN;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl, handle.ctx);
  } finally {
    handle.stopScheduler();
    await new Promise<void>((resolve, reject) => {
      handle.server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/conversations and messages list", async () => {
  await withServer(async (baseUrl, ctx) => {
    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:api-1",
      participantIgUserId: "api-1",
      participantUsername: "cliente",
    });

    ctx.messages.upsertInbound({
      igMessageId: "ig-api-msg-1",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: new Date().toISOString(),
    });

    const list = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(list.status, 200);
    const listBody = (await list.json()) as {
      conversations: Array<{ participant_username: string | null }>;
    };
    assert.equal(listBody.conversations.length, 1);
    assert.equal(listBody.conversations[0]?.participant_username, "cliente");

    const messages = await fetch(`${baseUrl}/api/conversations/${conversation.id}/messages`, {
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(messages.status, 200);
    const messagesBody = (await messages.json()) as {
      messages: Array<{ text: string | null }>;
    };
    assert.equal(messagesBody.messages.length, 1);
    assert.equal(messagesBody.messages[0]?.text, "oi");
  });
});

test("GET /api/conversations/activity returns pending approval", async () => {
  await withServer(async (baseUrl, ctx) => {
    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:act-2",
      participantIgUserId: "act-2",
    });

    const { message } = ctx.messages.upsertInbound({
      igMessageId: "ig-act-msg",
      conversationId: conversation.id,
      text: "preço?",
      igTimestamp: new Date().toISOString(),
    });

    ctx.messageReplies.upsertDraft({
      messageId: message.id,
      draftText: "R$ 99",
    });

    const response = await fetch(
      `${baseUrl}/api/conversations/activity?kind=pending_approval`,
      { headers: { Authorization: `Bearer ${ADMIN}` } },
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      items: Array<{ message_id: string }>;
    };
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0]?.message_id, message.id);
  });
});

test("POST /api/messages/:id/approve-reply returns 502 when Meta send fails", async () => {
  await withServer(async (baseUrl, ctx) => {
    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:approve-fail",
      participantIgUserId: "approve-fail",
    });

    const { message } = ctx.messages.upsertInbound({
      igMessageId: "ig-approve-fail-msg",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: new Date().toISOString(),
    });

    ctx.messageReplies.upsertDraft({
      messageId: message.id,
      draftText: "Resposta sugerida",
    });

    const originalSender = ctx.metaMessageSender;
    ctx.metaMessageSender = {
      sendText: async () => {
        throw new MetaMessageSendError("Meta API error (500)", "send_failed");
      },
    };

    try {
      const response = await fetch(`${baseUrl}/api/messages/${message.id}/approve-reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ADMIN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      assert.equal(response.status, 502);
      const body = (await response.json()) as { error: { code: string } };
      assert.equal(body.error.code, "META_SEND_FAILED");

      const messages = await fetch(`${baseUrl}/api/conversations/${conversation.id}/messages`, {
        headers: { Authorization: `Bearer ${ADMIN}` },
      });
      const messagesBody = (await messages.json()) as {
        messages: Array<{ draft_text: string | null; status: string }>;
      };
      const updated = messagesBody.messages.find((item) => item.status === "failed");
      assert.ok(updated);
      assert.equal(updated?.draft_text, "Resposta sugerida");
    } finally {
      ctx.metaMessageSender = originalSender;
    }
  });
});

test("DELETE /api/messages/:id/draft removes stored draft", async () => {
  await withServer(async (baseUrl, ctx) => {
    const { conversation } = ctx.conversations.upsert({
      igConversationId: "ig:draft-del",
      participantIgUserId: "draft-del",
    });

    const { message } = ctx.messages.upsertInbound({
      igMessageId: "ig-draft-del-msg",
      conversationId: conversation.id,
      text: "tem estoque?",
      igTimestamp: new Date().toISOString(),
    });

    ctx.messageReplies.upsertDraft({
      messageId: message.id,
      draftText: "Sim, temos!",
    });

    const deleteResponse = await fetch(`${baseUrl}/api/messages/${message.id}/draft`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ADMIN}` },
    });
    assert.equal(deleteResponse.status, 200);
    const body = (await deleteResponse.json()) as { draft_text: string | null };
    assert.equal(body.draft_text, null);
  });
});
