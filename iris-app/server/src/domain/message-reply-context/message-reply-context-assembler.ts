import type { ConversationRepository } from "../../ports/conversation-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { ProductFieldPolicyRepository } from "../../ports/product-field-policy-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ReplyPersonaStore } from "../../ports/reply-persona-store.ts";
import { resolveActiveProductCatalog } from "../products/resolve-active-product-catalog.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import type { MessageReplyContext, MessageThreadEntry } from "./types.ts";
import type { Message } from "../messages/message.ts";

export type MessageReplyContextAssemblerDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  products: ProductRepository;
  productStoreLinks: ProductStoreLinkRepository;
  productFieldPolicies: ProductFieldPolicyRepository;
  personaStore: ReplyPersonaStore;
  resolveBrandUsername?: () => string | null;
};

function mapThreadEntry(
  entry: Message,
  conversationParticipantUsername: string | null,
  brandUsername: string | null,
): MessageThreadEntry {
  return {
    direction: entry.direction,
    text: entry.text ?? "",
    authorUsername:
      entry.direction === "inbound"
        ? conversationParticipantUsername
        : brandUsername,
  };
}

function lastInboundMessage(messages: Message[]): Message | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const row = messages[index];
    if (row?.direction === "inbound") {
      return row;
    }
  }
  return null;
}

export async function assembleConversationReplyContext(
  conversationId: string,
  deps: MessageReplyContextAssemblerDeps,
  options: { focusMessageId?: string | null } = {},
): Promise<MessageReplyContext | null> {
  const conversation = deps.conversations.findById(conversationId);
  if (!conversation) {
    return null;
  }

  const persona = deps.personaStore.get() ?? defaultReplyPersona();
  const threadMessages = deps.messages.listByConversationId(conversation.id);
  const brandUsername = deps.resolveBrandUsername?.() ?? null;

  const focusMessage = options.focusMessageId
    ? threadMessages.find((item) => item.id === options.focusMessageId) ?? null
    : null;

  const focusIndex = focusMessage
    ? threadMessages.findIndex((item) => item.id === focusMessage.id)
    : -1;

  const scopedMessages =
    focusIndex >= 0 ? threadMessages.slice(0, focusIndex + 1) : threadMessages;

  const entries = scopedMessages.map((entry) =>
    mapThreadEntry(entry, conversation.participantUsername, brandUsername),
  );

  const target = focusMessage ?? lastInboundMessage(threadMessages);

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
    brandUsername,
    targetMessage: {
      text: target?.text ?? null,
      authorUsername:
        target?.direction === "inbound" ? conversation.participantUsername : brandUsername,
    },
  };
}

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
  const brandUsername = deps.resolveBrandUsername?.() ?? null;
  const entries = threadMessages.map((entry) =>
    mapThreadEntry(entry, conversation.participantUsername, brandUsername),
  );

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
    brandUsername,
    targetMessage: {
      text: message.text,
      authorUsername: conversation.participantUsername,
    },
  };
}
