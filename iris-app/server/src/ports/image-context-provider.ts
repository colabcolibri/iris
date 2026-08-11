import type { PostReplyContext } from "../domain/reply-context/post-context.ts";

export type ImageReplyContext = {
  summaries: string[];
  visionEnabled: boolean;
};

export type ImageContextProvider = {
  build(postContext: PostReplyContext | null): Promise<ImageReplyContext>;
};
