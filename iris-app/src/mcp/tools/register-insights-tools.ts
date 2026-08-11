import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { fetchPostInsights } from "../../domain/insights/fetch-post-insights.ts";
import { refreshAllPostInsights } from "../../domain/insights/refresh-all-post-insights.ts";
import { serializePostInsightsSnapshot } from "../../domain/insights/post-insights-response.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerInsightsTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_get_post_insights",
    "Get Instagram insights for a post (uses cache when fresh)",
    {
      postId: z.string().min(1),
      force: z.boolean().optional(),
    },
    async (args) => {
      try {
        const result = await fetchPostInsights(ctx, args.postId, {
          force: args.force ?? false,
        });
        return jsonToolContent(result);
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "insights failed");
      }
    },
  );

  server.tool(
    "iris_get_post_insights_history",
    "List saved insight snapshots for a post",
    {
      postId: z.string().min(1),
      limit: z.number().int().min(1).max(200).optional(),
    },
    async (args) => {
      const post = ctx.posts.findById(args.postId);
      if (!post) {
        return toolError("post not found");
      }

      const limit = args.limit ?? 30;
      const snapshots = ctx.postInsightsStore.listByPostId(args.postId, limit);

      return jsonToolContent({
        post_id: args.postId,
        ig_media_id: post.igMediaId,
        snapshots: snapshots.map((snapshot) =>
          serializePostInsightsSnapshot(snapshot, { fromCache: true }),
        ),
      });
    },
  );

  server.tool(
    "iris_refresh_all_post_insights",
    "Refresh insights for published/monitored posts (rate-limited)",
    {
      limit: z.number().int().min(1).optional(),
      delayMs: z.number().int().min(250).max(5000).optional(),
      force: z.boolean().optional(),
    },
    async (args) => {
      try {
        const result = await refreshAllPostInsights(ctx, {
          limit: args.limit,
          delayMs: args.delayMs,
          force: args.force ?? true,
        });
        return jsonToolContent(result);
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "refresh failed");
      }
    },
  );
}
