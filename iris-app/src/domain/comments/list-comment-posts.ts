import type { PostReplyModeSetting } from "../reply-mode.ts";
import type { IgMediaStatus } from "../meta/ig-media-status.ts";

export type CommentPostSummary = {
  postId: string;
  caption: string | null;
  carouselSummary: string | null;
  publishedAt: string | null;
  igMediaId: string;
  status: string;
  replyMode: PostReplyModeSetting;
  autoReplyEnabled: boolean;
  igMediaStatus: IgMediaStatus | null;
  igMediaStatusDetail: string | null;
  igMediaStatusCheckedAt: string | null;
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
    autoReplyEnabled: boolean;
    igMediaStatus: IgMediaStatus | null;
    igMediaStatusDetail: string | null;
    igMediaStatusCheckedAt: string | null;
  }>;
  countCommentsByPostId: (postId: string) => { total: number; pending: number };
};

export function listCommentPosts(deps: ListCommentPostsDeps): CommentPostSummary[] {
  return deps
    .listManagedPosts()
    .filter((post): post is typeof post & { igMediaId: string } => Boolean(post.igMediaId))
    .map((post) => {
      const counts = deps.countCommentsByPostId(post.id);
      return {
        postId: post.id,
        caption: post.caption,
        carouselSummary: post.carouselSummary,
        publishedAt: post.publishedAt,
        igMediaId: post.igMediaId,
        status: post.status,
        replyMode: post.replyMode,
        autoReplyEnabled: post.autoReplyEnabled,
        igMediaStatus: post.igMediaStatus,
        igMediaStatusDetail: post.igMediaStatusDetail,
        igMediaStatusCheckedAt: post.igMediaStatusCheckedAt,
        commentsCount: counts.total,
        pendingCount: counts.pending,
      };
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.publishedAt ?? "");
      const rightTime = Date.parse(right.publishedAt ?? "");
      return rightTime - leftTime;
    });
}
