import { sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { assembleMessageReplyContext } from "../../../domain/message-reply-context/message-reply-context-assembler.ts";
import { serializeMessageReplyContext } from "../../../domain/message-reply-context/serialize-message-reply-context.ts";
import { resolveMessageReplyAudit } from "../../../domain/reply-audit/resolve-reply-audit.ts";
import { serializeReplyAudit } from "../../../domain/reply-audit/serialize-reply-audit.ts";
import { routeParam } from "../../route-resources.ts";
import { requireMessage } from "./message-resources.ts";

export const messagesInspectionRouter = createRouter([
  route(
    "GET",
    /^\/api\/messages\/([^/]+)\/reply-context$/,
    { adminOrAgent: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      const context = await assembleMessageReplyContext(
        messageId,
        match.ctx.messageReplyContextAssembler,
      );
      if (!context) {
        sendError(match.res, 404, "message not found");
        return;
      }

      sendJson(
        match.res,
        200,
        serializeMessageReplyContext(context, {
          messageId: message.id,
          igMessageId: message.igMessageId,
          conversationId: message.conversationId,
        }),
      );
    },
    { paramNames: ["messageId"] },
  ),

  route(
    "GET",
    /^\/api\/messages\/([^/]+)\/reply-audit$/,
    { admin: true },
    async (match) => {
      const messageId = routeParam(match, "messageId");
      const message = requireMessage(match, messageId);
      if (!message) {
        return;
      }

      const resolved = resolveMessageReplyAudit(messageId, {
        agentRuns: match.ctx.agentRuns,
        agentRunSteps: match.ctx.agentRunSteps,
        messageReplies: match.ctx.messageReplies,
      });
      if (!resolved) {
        sendError(match.res, 404, "no agent run for message");
        return;
      }

      sendJson(match.res, 200, serializeReplyAudit(resolved.run, resolved.steps));
    },
    { paramNames: ["messageId"] },
  ),
]);
