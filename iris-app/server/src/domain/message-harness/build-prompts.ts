import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import type { MessageReplyContext } from "../message-reply-context/types.ts";
import { formatResolvedProductForPrompt } from "../products/product-field-resolver.ts";
import type { ResolvedProductView } from "../products/resolved-product-view.ts";
import type { MessageCategory } from "./message-category.ts";
import { buildProductFactsBlock } from "./product-facts.ts";

function formatProducts(context: MessageReplyContext): string {
  if (context.products.length === 0) {
    return "(no active products)";
  }

  return context.products.map((product) => formatResolvedProductForPrompt(product)).join("\n");
}

function formatThread(context: MessageReplyContext): string {
  if (context.thread.entries.length === 0) {
    return "(no thread history)";
  }

  return context.thread.entries
    .map((entry) => {
      const author =
        entry.direction === "outbound"
          ? context.brandUsername ?? "brand"
          : entry.authorUsername ?? context.conversation.participantUsername ?? "user";
      return `[${entry.direction}] ${author}: ${entry.text}`;
    })
    .join("\n");
}

export function buildMessageTriagePrompt(
  context: MessageReplyContext,
  restrictions: string,
): string {
  return [
    "You are the Instagram DM triage stage.",
    "Classify the latest inbound message and decide whether to reply.",
    "Valid messageCategory values: product_inquiry, general_unclear, appreciation_sharing, conversation_sharter, harmful, advice_help.",
    "Also detect support difficulty: supportIntent (none | purchase_difficulty | order_issue | delivery_payment | general_help) and supportUrgency (low | medium | high).",
    "Examples of purchase_difficulty: cannot checkout, payment error. order_issue: my order, tracking. Raise urgency when the customer repeats the problem or shows frustration.",
    "In DMs Iris always replies except harmful (shouldReply=false).",
    "When messageCategory is product_inquiry, set productSlug when you identify a product from the list.",
    "Reply with JSON only:",
    '{"messageCategory":"...","productSlug":null,"shouldReply":true,"supportIntent":"none","supportUrgency":"low","reason":"...","reasoning":"..."}',
    "",
    `Brand persona: ${context.persona.brandName ?? "(unnamed)"}`,
    "",
    "Active products:",
    formatProducts(context),
    "",
    "Thread:",
    formatThread(context),
    "",
    "Target message:",
    context.targetMessage.text ?? "(empty)",
    "",
    "Restrictions:",
    restrictions || "(none)",
    context.conversation.replyPrompt
      ? `\nConversation briefing:\n${context.conversation.replyPrompt}`
      : "",
  ].join("\n");
}

export function buildMessageDraftPrompt(
  context: MessageReplyContext,
  agentContent: MessageAgentContent,
  maxChars: number,
  category: MessageCategory,
): string {
  return [
    "You write the Instagram DM reply.",
    `Triaged category: ${category}`,
    `Character limit: ${maxChars}.`,
    "Return only the final message text — no JSON.",
    "",
    "Soul (dm_soul):",
    agentContent.dmSoul || "(empty)",
    "",
    "Page (dm_page):",
    agentContent.dmPage || "(empty)",
    "",
    "Knowledge (dm_knowledge):",
    agentContent.dmKnowledge || "(empty)",
    "",
    "Restrictions:",
    agentContent.dmRestrictions || "(none)",
    "",
    "Products:",
    formatProducts(context),
    "",
    "Thread:",
    formatThread(context),
    "",
    "Message to reply to:",
    context.targetMessage.text ?? "(empty)",
    context.conversation.replyPrompt
      ? `\nConversation briefing:\n${context.conversation.replyPrompt}`
      : "",
  ].join("\n");
}

export function buildMessageVerifyPrompt(
  context: MessageReplyContext,
  agentContent: MessageAgentContent,
  draftText: string,
  maxChars: number,
  productFacts?: ResolvedProductView[],
): string {
  const factsBlock =
    productFacts && productFacts.length > 0
      ? buildProductFactsBlock(draftText, productFacts)
      : null;

  return [
    "Verify the DM draft before sending.",
    "Check that prices, URLs, and product names match the facts below.",
    "Reply with JSON only:",
    '{"approved":true,"harmful":false,"policyViolations":[],"reason":"...","reasoning":"...","finalText":"..."}',
    "",
    `Character limit: ${maxChars}.`,
    "",
    "Restrictions:",
    agentContent.dmRestrictions || "(none)",
    "",
    factsBlock ? `Product facts (reference):\n${factsBlock}\n` : "",
    "Thread:",
    formatThread(context),
    "",
    "Draft:",
    draftText,
  ].join("\n");
}
