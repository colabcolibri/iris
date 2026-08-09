import type { ReplyPersona } from "../../ports/reply-persona-store.ts";
import type { PostReplyContext } from "./post-context.ts";
import type { CommentThreadContext } from "./thread-context.ts";
import type { ImageReplyContext } from "../../ports/image-context-provider.ts";

export type ReplyContext = {
  persona: ReplyPersona;
  post: PostReplyContext | null;
  thread: CommentThreadContext;
  imageContext: ImageReplyContext;
  targetComment: {
    authorUsername: string | null;
    text: string | null;
  };
};
