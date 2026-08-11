import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { fetchAccountInsights } from "../../domain/insights/fetch-account-insights.ts";
import { fetchPostInsights } from "../../domain/insights/fetch-post-insights.ts";
import { refreshAllPostInsights } from "../../domain/insights/refresh-all-post-insights.ts";
import { refreshMediaInsightsPage } from "../../domain/insights/refresh-media-insights-page.ts";
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
    "iris_get_account_insights",
    "Get Instagram account-level insights (live; period + optional since/until)",
    {
      period: z.string().optional(),
      since: z.union([z.string(), z.number()]).optional(),
      until: z.union([z.string(), z.number()]).optional(),
      metrics: z.array(z.string().min(1)).optional(),
    },
    async (args) => {
      try {
        const result = await fetchAccountInsights(ctx, {
          period: args.period,
          since: args.since,
          until: args.until,
          metrics: args.metrics,
        });
        return jsonToolContent(result);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "account insights failed",
        );
      }
    },
  );

  server.tool(
    "iris_refresh_all_post_insights",
    "Refresh insights for published/monitored posts one-by-one (rate-limited)",
    {
      limit: z.number().int().min(1).optional(),
      delayMs: z.number().int().min(250).max(5000).optional(),
      force: z.boolean().optional(),
      since: z.string().optional(),
      until: z.string().optional(),
    },
    async (args) => {
      try {
        const result = await refreshAllPostInsights(ctx, {
          limit: args.limit,
          delayMs: args.delayMs,
          force: args.force ?? true,
          since: args.since,
          until: args.until,
        });
        return jsonToolContent(result);
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "refresh failed");
      }
    },
  );

  server.tool(
    "iris_refresh_media_insights_page",
    "Refresh managed posts from one /me/media page with insights field expansion (~1 Meta call)",
    {
      limit: z.number().int().min(1).max(50).optional(),
      after: z.string().optional(),
      since: z.string().optional(),
      until: z.string().optional(),
      force: z.boolean().optional(),
    },
    async (args) => {
      try {
        const result = await refreshMediaInsightsPage(ctx, {
          limit: args.limit,
          after: args.after,
          since: args.since,
          until: args.until,
          force: args.force ?? true,
        });
        return jsonToolContent(result);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "media page refresh failed",
        );
      }
    },
  );
}
