import type { MessageReplyContext } from "./types.ts";

export type SerializedMessageReplyContextMeta = {
  messageId: string;
  igMessageId: string;
  conversationId: string;
};

export function serializeMessageReplyContext(
  context: MessageReplyContext,
  meta: SerializedMessageReplyContextMeta,
) {
  return {
    target_message: {
      id: meta.messageId,
      ig_message_id: meta.igMessageId,
      author: context.targetMessage.authorUsername,
      text: context.targetMessage.text,
    },
    conversation: {
      id: meta.conversationId,
      participant_username: context.conversation.participantUsername,
      reply_prompt: context.conversation.replyPrompt,
    },
    thread: context.thread.entries.map((entry) => ({
      direction: entry.direction,
      author: entry.authorUsername,
      text: entry.text,
    })),
    products: context.products.map((product) => ({
      slug: product.slug,
      name: product.name,
      short_description: product.shortDescription,
      long_description: product.longDescription,
      price: product.price,
      url: product.url,
      image_url: product.imageUrl,
      sku: product.sku,
      field_sources: product.fieldSources,
    })),
    persona: {
      response_language: context.persona.responseLanguage,
      brand_name: context.persona.brandName,
      max_chars: context.persona.maxChars,
    },
    brand_username: context.brandUsername,
  };
}
