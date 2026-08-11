import type { ImageContextProvider } from "../../ports/image-context-provider.ts";
import type { ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import type { CommentRepository } from "../../ports/comment-repository.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";
import { buildPostReplyContext, type BuildPostReplyContextDeps } from "./build-post-context.ts";
import { buildCommentThreadContext } from "./build-thread-context.ts";
import type { ReplyContext } from "./types.ts";

export type ReplyContextAssemblerDeps = BuildPostReplyContextDeps & {
  comments: CommentRepository;
  personaStore: ReplyPersonaStore;
  imageContextProvider: ImageContextProvider;
  resolveBrandUsername?: () => string | null;
};

export async function assembleReplyContext(
  commentId: string,
  deps: ReplyContextAssemblerDeps,
): Promise<ReplyContext | null> {
  const comment = deps.comments.findById(commentId);
  if (!comment) {
    return null;
  }

  const persona = deps.personaStore.get() ?? defaultReplyPersona();
  const post = buildPostReplyContext(comment.postId, deps);
  const thread =
    buildCommentThreadContext(commentId, { comments: deps.comments }) ?? {
      entries: [],
    };
  const imageContext = await deps.imageContextProvider.build(post);

  return {
    persona,
    post,
    thread,
    imageContext,
    brandUsername: deps.resolveBrandUsername?.() ?? null,
    targetComment: {
      authorUsername: comment.authorUsername,
      text: comment.text,
      igCommentId: comment.igCommentId,
    },
  };
}
