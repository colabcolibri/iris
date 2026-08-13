import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { ProductFieldPolicyRepository } from "../../ports/product-field-policy-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import { resolveActiveProductCatalog } from "../products/resolve-active-product-catalog.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import type { MessageReplyContext, MessageThreadEntry } from "./types.ts";

export type MessageReplyContextAssemblerDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  products: ProductRepository;
  productStoreLinks: ProductStoreLinkRepository;
  productFieldPolicies: ProductFieldPolicyRepository;
  personaStore: ReplyPersonaStore;
  resolveBrandUsername?: () => string | null;
};

export async function assembleMessageReplyContext(
  messageId: string,
  deps: MessageReplyContextAssemblerDeps,
): Promise<MessageReplyContext | null> {
  const message = deps.messages.findById(messageId);
  if (!message) {
    return null;
  }

  const conversation = deps.conversations.findById(message.conversationId);
  if (!conversation) {
    return null;
  }

  const persona = deps.personaStore.get() ?? defaultReplyPersona();
  const threadMessages = deps.messages.listByConversationId(conversation.id);
  const entries: MessageThreadEntry[] = threadMessages.map((entry) => ({
    direction: entry.direction,
    text: entry.text ?? "",
    authorUsername:
      entry.direction === "inbound"
        ? conversation.participantUsername
        : deps.resolveBrandUsername?.() ?? null,
  }));

  return {
    persona,
    conversation: {
      participantUsername: conversation.participantUsername,
      replyPrompt: conversation.replyPrompt,
    },
    thread: { entries },
    products: resolveActiveProductCatalog(
      {
        products: deps.products,
        productStoreLinks: deps.productStoreLinks,
        productFieldPolicies: deps.productFieldPolicies,
      },
      true,
    ),
    brandUsername: deps.resolveBrandUsername?.() ?? null,
    targetMessage: {
      text: message.text,
      authorUsername: conversation.participantUsername,
    },
  };
}
