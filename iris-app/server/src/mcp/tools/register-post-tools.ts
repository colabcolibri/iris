import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializePost, serializeAsset } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import { parseIsoDateParam } from "../../domain/time/datetime-ui.ts";
import {
  assertMetaReadyForSchedule,
  MetaNotConnectedError,
} from "../../domain/meta/meta-readiness.ts";
import {
  normalizeCreatePost,
  normalizeUpdatePost,
} from "../../domain/posts/post-mutations.ts";
import type { PostStatus } from "../../domain/posts/post.ts";
import { applyScheduleRules } from "../../domain/posts/schedule.ts";
import {
  purgeCancelledPost,
  PurgeCancelledPostError,
} from "../../domain/posts/purge-cancelled-post.ts";
import { confirmPhraseMatches } from "../../domain/safety/confirm-phrase.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

const CANCEL_CONFIRM_PHRASE = "cancelar";
const PURGE_CONFIRM_PHRASE = "deletar";

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

      const assets = ctx.assets.listByPostId(args.postId).map(serializeAsset);
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
    "Update caption, carousel_summary, reply_prompt, silence flags, schedule or status for a post. Do NOT set status=cancelled here — use iris_cancel_post after user confirmation.",
    {
      postId: z.string().min(1),
      caption: z.string().optional(),
      carouselSummary: z.string().nullable().optional(),
      replyPrompt: z.string().nullable().optional(),
      silenceSoul: z.boolean().optional(),
      silencePage: z.boolean().optional(),
      silenceKnowledge: z.boolean().optional(),
      silenceRestrictions: z.boolean().optional(),
      scheduledAt: z.string().nullable().optional(),
      status: z.string().optional(),
    },
    async (args) => {
      try {
        if (args.status === "cancelled") {
          return toolError(
            `status=cancelled is blocked here. Ask the user to confirm, then call iris_cancel_post with confirmPhrase "${CANCEL_CONFIRM_PHRASE}".`,
          );
        }

        const body: Record<string, unknown> = {};
        if (args.caption !== undefined) body.caption = args.caption;
        if (args.carouselSummary !== undefined) {
          body.carousel_summary = args.carouselSummary;
        }
        if (args.replyPrompt !== undefined) body.reply_prompt = args.replyPrompt;
        if (args.silenceSoul !== undefined) body.silence_soul = args.silenceSoul;
        if (args.silencePage !== undefined) body.silence_page = args.silencePage;
        if (args.silenceKnowledge !== undefined) {
          body.silence_knowledge = args.silenceKnowledge;
        }
        if (args.silenceRestrictions !== undefined) {
          body.silence_restrictions = args.silenceRestrictions;
        }
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

  server.tool(
    "iris_cancel_post",
    `Soft-delete a post (status=cancelled). Reversible via restore to draft. REQUIRED: ask the user to confirm first, then pass confirmPhrase "${CANCEL_CONFIRM_PHRASE}". Do not invent confirmation.`,
    {
      postId: z.string().min(1),
      confirmPhrase: z
        .string()
        .min(1)
        .describe(
          `Must be exactly "${CANCEL_CONFIRM_PHRASE}" after the user explicitly confirms cancellation`,
        ),
    },
    async (args) => {
      if (!confirmPhraseMatches(args.confirmPhrase, CANCEL_CONFIRM_PHRASE)) {
        return toolError(
          `Confirmation required. Ask the user to confirm cancellation, then retry with confirmPhrase "${CANCEL_CONFIRM_PHRASE}".`,
        );
      }

      const cancelled = ctx.posts.cancel(args.postId);
      if (!cancelled) {
        return toolError("post not found");
      }

      notifyPostsChanged({ post_id: args.postId });
      return jsonToolContent({
        cancelled: true,
        post: serializePost(cancelled),
        note: "Post marked cancelled. Permanent delete requires iris_purge_cancelled_post after a second user confirmation.",
      });
    },
  );

  server.tool(
    "iris_purge_cancelled_post",
    `Permanently delete a CANCELLED post from the database (media + linked comments). Irreversible. REQUIRED: ask the user to confirm deletion of this cancelled post, then pass confirmPhrase "${PURGE_CONFIRM_PHRASE}". Refuses if the post is not cancelled.`,
    {
      postId: z.string().min(1),
      confirmPhrase: z
        .string()
        .min(1)
        .describe(
          `Must be exactly "${PURGE_CONFIRM_PHRASE}" after the user explicitly confirms permanent deletion`,
        ),
    },
    async (args) => {
      if (!confirmPhraseMatches(args.confirmPhrase, PURGE_CONFIRM_PHRASE)) {
        return toolError(
          `Confirmation required. Ask the user to confirm permanent deletion of this cancelled post, then retry with confirmPhrase "${PURGE_CONFIRM_PHRASE}".`,
        );
      }

      try {
        await purgeCancelledPost(args.postId, {
          posts: ctx.posts,
          assets: ctx.assets,
          mediaStorage: ctx.mediaStorage,
        });
      } catch (error) {
        if (error instanceof PurgeCancelledPostError) {
          return toolError(error.message);
        }
        return toolError(
          error instanceof Error ? error.message : "purge failed",
        );
      }

      notifyPostsChanged({ post_id: args.postId });
      return jsonToolContent({
        purged: true,
        post_id: args.postId,
      });
    },
  );
}
