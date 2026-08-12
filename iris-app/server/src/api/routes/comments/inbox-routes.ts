import { readJsonBody, sendError, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { serializePost } from "../../../adapters/sqlite/mappers.ts";
import { buildCommentsInbox, buildLocalCommentsInbox } from "../../../domain/comments/build-comments-inbox.ts";
import { listCommentPosts } from "../../../domain/comments/list-comment-posts.ts";
import {
  firstPostMediaUrl,
  resolvePostMedia,
} from "../../../domain/post-media/resolve-post-media.ts";
import { getMetaReadiness } from "../../../domain/meta/meta-readiness.ts";
import { requirePost } from "../../route-resources.ts";

export const commentsInboxRouter = createRouter([
  route("GET", "/api/comments/posts", { admin: true }, async (match) => {
    const posts = listCommentPosts({
      listManagedPosts: () =>
        match.ctx.posts
          .list()
          .filter(
            (post) =>
              Boolean(post.igMediaId) &&
              (post.status === "published" || post.status === "monitored"),
          )
          .map((post) => ({
            id: post.id,
            caption: post.caption,
            carouselSummary: post.carouselSummary,
            publishedAt: post.publishedAt,
            igMediaId: post.igMediaId,
            status: post.status,
            replyMode: post.replyMode,
            replyPrompt: post.replyPrompt,
            silenceSoul: post.silenceSoul,
            silencePage: post.silencePage,
            silenceKnowledge: post.silenceKnowledge,
            silenceRestrictions: post.silenceRestrictions,
            autoReplyEnabled: post.autoReplyEnabled,
            igMediaStatus: post.igMediaStatus,
            igMediaStatusDetail: post.igMediaStatusDetail,
            igMediaStatusCheckedAt: post.igMediaStatusCheckedAt,
            likeCount: post.likeCount,
            reportedCommentsCount: post.reportedCommentsCount,
          })),
      countCommentsByPostId: (postId) => match.ctx.comments.countByPostId(postId),
    });

    sendJson(match.res, 200, {
      posts: await Promise.all(
        posts.map(async (post) => {
          const firstAsset = match.ctx.assets.listByPostId(post.postId)[0];
          let previewUrl: string | null = firstAsset
            ? `/api/posts/${post.postId}/assets/${encodeURIComponent(firstAsset.storagePath)}`
            : null;

          if (!previewUrl && post.igMediaId && getMetaReadiness(match.ctx).ready) {
            const media = await resolvePostMedia(post.postId, {
              posts: match.ctx.posts,
              assets: match.ctx.assets,
              metaCommentReader: match.ctx.metaCommentReader,
              publicBaseUrl: match.ctx.publicBaseUrl,
              publishUrlSecret: match.ctx.publishUrlSecret,
            });
            previewUrl = firstPostMediaUrl(media);
          }

          let likeCount = post.likeCount;
          if (likeCount == null) {
            const snap = match.ctx.postInsightsStore.findLatestByPostId(post.postId);
            const likesMetric = snap?.metrics.find((item) => item.name === "likes");
            const likesValue = likesMetric?.values[0]?.value;
            if (typeof likesValue === "number") {
              likeCount = likesValue;
              match.ctx.posts.update(post.postId, { likeCount: likesValue });
            }
          }

          return {
            post_id: post.postId,
            caption: post.caption,
            carousel_summary: post.carouselSummary ?? null,
            published_at: post.publishedAt,
            ig_media_id: post.igMediaId,
            status: post.status,
            is_external: post.status === "monitored",
            reply_mode: post.replyMode,
            reply_prompt: post.replyPrompt,
            silence_soul: post.silenceSoul,
            silence_page: post.silencePage,
            silence_knowledge: post.silenceKnowledge,
            silence_restrictions: post.silenceRestrictions,
            auto_reply_enabled: post.autoReplyEnabled,
            ig_media_status: post.igMediaStatus,
            ig_media_status_detail: post.igMediaStatusDetail,
            ig_media_status_checked_at: post.igMediaStatusCheckedAt,
            like_count: likeCount,
            reported_comments_count: post.reportedCommentsCount,
            comments_count: post.commentsCount,
            pending_count: post.pendingCount,
            preview_filename: firstAsset?.storagePath ?? null,
            preview_mime: firstAsset?.mime ?? null,
            preview_url: previewUrl,
          };
        }),
      ),
    });
  }),

  route("GET", "/api/comments/inbox", { admin: true, metaReady: true }, async (match) => {
    const daysRaw = Number(match.searchParams.get("days") ?? "30");
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 90) : 30;
    const sourceParam = match.searchParams.get("source")?.trim().toLowerCase();
    const source = sourceParam === "meta" ? "meta" : "local";
    const scopeParam = match.searchParams.get("scope")?.trim().toLowerCase();
    const scope = scopeParam === "all" ? "all" : "iris";
    const igMediaIdParam = match.searchParams.get("ig_media_id")?.trim() || undefined;
    const postIdParam = match.searchParams.get("post_id")?.trim() || undefined;

    let igMediaId = igMediaIdParam;
    if (!igMediaId && postIdParam) {
      const post = requirePost(match, postIdParam);
      if (!post) {
        return;
      }
      if (!post.igMediaId) {
        sendError(match.res, 422, "post has no ig_media_id");
        return;
      }
      igMediaId = post.igMediaId;
    }

    const inboxDeps = {
      metaCommentReader: match.ctx.metaCommentReader,
      findPostIdByIgMediaId: (mediaId: string) =>
        match.ctx.posts.findByIgMediaId(mediaId)?.id ?? null,
      listIrisPostsSince: (since: Date) =>
        match.ctx.posts
          .list({ from: since.toISOString(), calendarOnly: true })
          .filter((post) => post.igMediaId && post.status === "published")
          .map((post) => ({
            id: post.id,
            igMediaId: post.igMediaId!,
            caption: post.caption,
            publishedAt: post.publishedAt,
            scheduledAt: post.scheduledAt,
          })),
      listCommentsByPostId: (postId: string) =>
        match.ctx.comments.listByPostId(postId).map((comment) => ({
          id: comment.id,
          igCommentId: comment.igCommentId,
          parentIgCommentId: comment.parentIgCommentId,
          authorUsername: comment.authorUsername,
          text: comment.text,
          status: comment.status,
          createdAt: comment.createdAt,
        })),
      upsertFromWebhook: (
        input: Parameters<typeof match.ctx.comments.upsertFromWebhook>[0],
      ) => match.ctx.comments.upsertFromWebhook(input),
      findByIgCommentId: (igCommentId: string) =>
        match.ctx.comments.findByIgCommentId(igCommentId),
    };

    try {
      const inbox =
        source === "local"
          ? buildLocalCommentsInbox(days, inboxDeps, { igMediaId })
          : await buildCommentsInbox(days, inboxDeps, { igMediaId, scope });

      sendJson(match.res, 200, {
        source: inbox.source,
        synced_at: inbox.syncedAt,
        days: inbox.days,
        summary: inbox.summary,
        media: inbox.media.map((item) => ({
          ig_media_id: item.igMediaId,
          post_id: item.postId,
          caption: item.caption,
          media_timestamp: item.mediaTimestamp,
          reported_comments_count: item.reportedCommentsCount,
          comments: item.comments.map((comment) => ({
            ig_comment_id: comment.igCommentId,
            parent_ig_comment_id: comment.parentIgCommentId,
            author_username: comment.authorUsername,
            text: comment.text,
            timestamp: comment.timestamp,
            iris_comment_id: comment.irisCommentId,
            status: comment.status,
          })),
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to sync comments";
      sendError(match.res, 502, message);
    }
  }),
]);
