import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializeComment } from "../../adapters/sqlite/mappers.ts";
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
}
