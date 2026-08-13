import type { ReplyPersona } from "../../ports/reply-persona-store.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";
import type { MessageCategory } from "../message-harness/message-category.ts";

export type MessageThreadEntry = {
  direction: "inbound" | "outbound";
  text: string;
  authorUsername: string | null;
};

export type MessageReplyContext = {
  persona: ReplyPersona;
  conversation: {
    participantUsername: string | null;
    replyPrompt: string | null;
  };
  thread: {
    entries: MessageThreadEntry[];
  };
  products: ResolvedProductView[];
  brandUsername: string | null;
  targetMessage: {
    text: string | null;
    authorUsername: string | null;
  };
  messageCategory?: MessageCategory;
};
