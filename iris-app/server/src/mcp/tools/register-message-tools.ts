import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializeConversation } from "../../domain/messages/serialize-conversation.ts";
import { assembleMessageReplyContext } from "../../domain/message-reply-context/message-reply-context-assembler.ts";
import { serializeMessageReplyContext } from "../../domain/message-reply-context/serialize-message-reply-context.ts";
import { serializeMessageWithDraft } from "../../api/routes/messages/shared.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerMessageTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_conversations",
    "List recent Instagram DM conversations",
    {
      limit: z.number().int().min(1).max(200).optional(),
    },
    async (args) => {
      const limit = args.limit ?? 50;
      const conversations = ctx.conversations.listRecent(limit).map((conversation) => ({
        ...serializeConversation(conversation),
        pending_count: ctx.messages.countPendingByConversation(conversation.id),
        unread_count: ctx.messages.countUnreadByConversation(
          conversation.id,
          conversation.operatorReadAt,
        ),
      }));
      return jsonToolContent({ conversations });
    },
  );

  server.tool(
    "iris_list_conversation_messages",
    "List messages in a DM conversation (with draft metadata when present)",
    {
      conversationId: z.string().min(1),
    },
    async (args) => {
      const conversation = ctx.conversations.findById(args.conversationId);
      if (!conversation) {
        return toolError("conversation not found");
      }

      const messages = ctx.messages
        .listByConversationId(conversation.id)
        .map((message) => serializeMessageWithDraft(message, ctx));

      return jsonToolContent({
        conversation: {
          ...serializeConversation(conversation),
          pending_count: ctx.messages.countPendingByConversation(conversation.id),
        unread_count: ctx.messages.countUnreadByConversation(
          conversation.id,
          conversation.operatorReadAt,
        ),
        },
        messages,
      });
    },
  );

  server.tool(
    "iris_get_message_reply_context",
    "Get full reply context for a DM (thread, persona, active products)",
    {
      messageId: z.string().min(1),
    },
    async (args) => {
      const message = ctx.messages.findById(args.messageId);
      if (!message) {
        return toolError("message not found");
      }

      const context = await assembleMessageReplyContext(
        args.messageId,
        ctx.messageReplyContextAssembler,
      );
      if (!context) {
        return toolError("message not found");
      }

      return jsonToolContent(
        serializeMessageReplyContext(context, {
          messageId: message.id,
          igMessageId: message.igMessageId,
          conversationId: message.conversationId,
        }),
      );
    },
  );
}
