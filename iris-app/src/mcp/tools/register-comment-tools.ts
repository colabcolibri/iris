import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializeComment } from "../../adapters/sqlite/mappers.ts";
import { assembleReplyContext } from "../../domain/reply-context/reply-context-assembler.ts";
import { serializeReplyContext } from "../../domain/reply-context/serialize-reply-context.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerCommentTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_post_comments",
    "List Instagram comments synced for a post",
    {
      postId: z.string().min(1),
    },
    async (args) => {
      const post = ctx.posts.findById(args.postId);
      if (!post) {
        return toolError("post not found");
      }

      const comments = ctx.comments.listByPostId(args.postId);
      return jsonToolContent({
        comments: comments.map(serializeComment),
      });
    },
  );

  server.tool(
    "iris_get_reply_context",
    "Get full reply context for a comment (thread, post, images, persona)",
    {
      commentId: z.string().min(1),
    },
    async (args) => {
      const comment = ctx.comments.findById(args.commentId);
      if (!comment) {
        return toolError("comment not found");
      }

      const context = await assembleReplyContext(args.commentId, ctx.replyContextAssembler);
      if (!context) {
        return toolError("comment not found");
      }

      const post = ctx.posts.findById(comment.postId);
      return jsonToolContent(
        serializeReplyContext(context, {
          commentId: comment.id,
          igCommentId: comment.igCommentId,
          postId: comment.postId,
          igMediaId: post?.igMediaId ?? null,
        }),
      );
    },
  );
}
