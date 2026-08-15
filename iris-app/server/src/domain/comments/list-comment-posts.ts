import type { PostReplyModeSetting } from "../posts/reply-mode.ts";
import type { IgMediaStatus } from "../meta/ig-media-status.ts";
import { isManagedCommentPost } from "./is-managed-comment-post.ts";

export type CommentPostSummary = {
  postId: string;
  caption: string | null;
  carouselSummary: string | null;
  publishedAt: string | null;
  igMediaId: string;
  status: string;
  replyMode: PostReplyModeSetting;
  replyPrompt: string | null;
  silenceSoul: boolean;
  silencePage: boolean;
  silenceKnowledge: boolean;
  silenceRestrictions: boolean;
  autoReplyEnabled: boolean;
  agentActiveDays: number | null;
  privateReplyMode: PostReplyModeSetting;
  igMediaStatus: IgMediaStatus | null;
  igMediaStatusDetail: string | null;
  igMediaStatusCheckedAt: string | null;
  likeCount: number | null;
  reportedCommentsCount: number | null;
  commentsCount: number;
  pendingCount: number;
};

export type ListCommentPostsDeps = {
  listManagedPosts: () => Array<{
    id: string;
    caption: string | null;
    carouselSummary: string | null;
    publishedAt: string | null;
    igMediaId: string | null;
    status: string;
    replyMode: PostReplyModeSetting;
    replyPrompt: string | null;
    silenceSoul: boolean;
    silencePage: boolean;
    silenceKnowledge: boolean;
    silenceRestrictions: boolean;
    autoReplyEnabled: boolean;
    agentActiveDays: number | null;
    privateReplyMode: PostReplyModeSetting;
    igMediaStatus: IgMediaStatus | null;
    igMediaStatusDetail: string | null;
    igMediaStatusCheckedAt: string | null;
    likeCount: number | null;
    reportedCommentsCount: number | null;
  }>;
  countCommentsByPostId: (postId: string) => { total: number; pending: number };
};

export function listCommentPosts(
  deps: ListCommentPostsDeps,
  options?: { now?: Date },
): CommentPostSummary[] {
  const now = options?.now ?? new Date();
  return deps
    .listManagedPosts()
    .filter((post) => isManagedCommentPost(post, now))
    .filter((post): post is typeof post & { igMediaId: string } => Boolean(post.igMediaId))
    .map((post) => {
      const counts = deps.countCommentsByPostId(post.id);
      const reported = post.reportedCommentsCount ?? 0;
      return {
        postId: post.id,
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
        agentActiveDays: post.agentActiveDays,
        privateReplyMode: post.privateReplyMode,
        igMediaStatus: post.igMediaStatus,
        igMediaStatusDetail: post.igMediaStatusDetail,
        igMediaStatusCheckedAt: post.igMediaStatusCheckedAt,
        likeCount: post.likeCount,
        reportedCommentsCount: post.reportedCommentsCount,
        commentsCount: Math.max(counts.total, reported),
        pendingCount: counts.pending,
      };
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.publishedAt ?? "");
      const rightTime = Date.parse(right.publishedAt ?? "");
      return rightTime - leftTime;
    });
}
