import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializePost } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import { parseIsoDateParam } from "../../domain/datetime-ui.ts";
import {
  assertMetaReadyForSchedule,
  MetaNotConnectedError,
} from "../../domain/meta-readiness.ts";
import {
  normalizeCreatePost,
  normalizeUpdatePost,
} from "../../domain/post-mutations.ts";
import type { PostStatus } from "../../domain/post.ts";
import { applyScheduleRules } from "../../domain/schedule.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerPostTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_posts",
    "List editorial posts with optional filters",
    {
      status: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    },
    async (args) => {
      try {
        const status = args.status as PostStatus | undefined;
        const from = args.from ? parseIsoDateParam(args.from, "from") : undefined;
        const to = args.to ? parseIsoDateParam(args.to, "to") : undefined;
        const posts = ctx.posts.list({ status, from, to });
        return jsonToolContent({ posts: posts.map(serializePost) });
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "list failed");
      }
    },
  );

  server.tool(
    "iris_get_post",
    "Get a post by id with asset metadata",
    {
      postId: z.string().min(1),
    },
    async (args) => {
      const post = ctx.posts.findById(args.postId);
      if (!post) {
        return toolError("post not found");
      }

      const assets = ctx.assets.listByPostId(args.postId);
      return jsonToolContent({
        post: serializePost(post),
        assets,
      });
    },
  );

  server.tool(
    "iris_create_post",
    "Create a draft or scheduled post",
    {
      caption: z.string().optional(),
      channel: z.string().default("instagram"),
      scheduledAt: z.string().nullable().optional(),
      sourceNote: z.string().optional(),
      status: z.string().optional(),
    },
    async (args) => {
      try {
        const input = normalizeCreatePost({
          caption: args.caption,
          channel: args.channel,
          scheduled_at: args.scheduledAt,
          source_note: args.sourceNote,
          status: args.status,
        });
        const post = ctx.posts.create({
          caption: input.caption,
          channel: input.channel,
          scheduledAt: input.scheduledAt,
          sourceNote: input.sourceNote,
          status: input.status,
        });
        notifyPostsChanged({ post_id: post.id });
        return jsonToolContent(serializePost(post));
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "create failed");
      }
    },
  );

  server.tool(
    "iris_update_post",
    "Update caption, schedule or status for a post",
    {
      postId: z.string().min(1),
      caption: z.string().optional(),
      scheduledAt: z.string().nullable().optional(),
      status: z.string().optional(),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {};
        if (args.caption !== undefined) body.caption = args.caption;
        if (args.scheduledAt !== undefined) body.scheduled_at = args.scheduledAt;
        if (args.status !== undefined) body.status = args.status;

        const update = normalizeUpdatePost(body);
        const current = ctx.posts.findById(args.postId);
        if (!current) {
          return toolError("post not found");
        }

        const assetsCount = ctx.assets.listByPostId(args.postId).length;
        const scheduling =
          update.status === "scheduled" || update.scheduledAt !== undefined;

        const schedule = scheduling
          ? applyScheduleRules({
              currentStatus: current.status,
              nextStatus: update.status,
              scheduledAt:
                update.scheduledAt !== undefined
                  ? update.scheduledAt
                  : current.scheduledAt,
              assetsCount,
            })
          : {
              status: update.status ?? current.status,
              scheduledAt:
                update.scheduledAt !== undefined
                  ? update.scheduledAt
                  : current.scheduledAt,
            };

        if (schedule.status === "scheduled") {
          assertMetaReadyForSchedule(ctx);
        }

        const nextStatus = schedule.status;
        const clearError =
          nextStatus === "draft" && current.status === "failed";

        const updated = ctx.posts.update(args.postId, {
          ...update,
          status: nextStatus,
          scheduledAt: schedule.scheduledAt,
          errorMessage: clearError ? null : undefined,
        });

        notifyPostsChanged({ post_id: args.postId });
        return jsonToolContent(serializePost(updated!));
      } catch (error) {
        if (error instanceof MetaNotConnectedError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "update failed");
      }
    },
  );
}
