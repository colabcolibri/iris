import type { MessageReplyContext } from "../message-reply-context/types.ts";

export const SUPPORT_INTENTS = [
  "none",
  "purchase_difficulty",
  "order_issue",
  "delivery_payment",
  "general_help",
] as const;

export type SupportIntent = (typeof SUPPORT_INTENTS)[number];

export const SUPPORT_URGENCIES = ["low", "medium", "high"] as const;

export type SupportUrgency = (typeof SUPPORT_URGENCIES)[number];

export type SupportSignals = {
  supportIntent: SupportIntent;
  supportUrgency: SupportUrgency;
};

const PURCHASE_DIFFICULTY_RE =
  /\b(?:não consigo|nao consigo|não consegui|nao consegui|problema (?:na|no) compra|erro no pagamento|pagamento não|pagamento nao|cobraram|cartão recusado|cartao recusado|checkout|finalizar (?:a )?compra)\b/iu;

const ORDER_ISSUE_RE =
  /\b(?:meu pedido|número do pedido|numero do pedido|pedido #|rastreio|rastrear|não chegou|nao chegou|ainda não recebi|ainda nao recebi)\b/iu;

const DELIVERY_PAYMENT_RE =
  /\b(?:entrega|frete|prazo|boleto|pix|estorno|reembolso|chargeback|duplicado)\b/iu;

const GENERAL_HELP_RE =
  /\b(?:me ajuda|preciso de ajuda|pode ajudar|ninguém responde|ninguem responde|já perguntei|ja perguntei|não entendi|nao entendi)\b/iu;

const FRUSTRATION_RE =
  /\b(?:de novo|outra vez|insatisfeit|péssimo|pessimo|horrível|horrivel|absurdo)\b/iu;

export function isSupportIntent(value: string): value is SupportIntent {
  return SUPPORT_INTENTS.includes(value as SupportIntent);
}

export function isSupportUrgency(value: string): value is SupportUrgency {
  return SUPPORT_URGENCIES.includes(value as SupportUrgency);
}

export function normalizeSupportIntent(value: unknown): SupportIntent {
  if (typeof value === "string" && isSupportIntent(value)) {
    return value;
  }
  return "none";
}

export function normalizeSupportUrgency(value: unknown): SupportUrgency {
  if (typeof value === "string" && isSupportUrgency(value)) {
    return value;
  }
  return "low";
}

function detectIntentFromText(text: string): SupportIntent {
  if (PURCHASE_DIFFICULTY_RE.test(text)) {
    return "purchase_difficulty";
  }
  if (ORDER_ISSUE_RE.test(text)) {
    return "order_issue";
  }
  if (DELIVERY_PAYMENT_RE.test(text)) {
    return "delivery_payment";
  }
  if (GENERAL_HELP_RE.test(text)) {
    return "general_help";
  }
  return "none";
}

function countInboundAfterLastOutbound(context: MessageReplyContext): number {
  const entries = context.thread.entries;
  let lastOutboundIndex = -1;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.direction === "outbound") {
      lastOutboundIndex = index;
      break;
    }
  }
  if (lastOutboundIndex < 0) {
    return entries.filter((entry) => entry.direction === "inbound").length;
  }
  return entries
    .slice(lastOutboundIndex + 1)
    .filter((entry) => entry.direction === "inbound").length;
}

export function inferSupportSignals(
  context: MessageReplyContext,
  llmIntent?: unknown,
  llmUrgency?: unknown,
  messageCategory?: string,
): SupportSignals {
  const targetText = context.targetMessage.text ?? "";
  const threadText = context.thread.entries
    .map((entry) => entry.text)
    .join("\n");
  const combined = `${targetText}\n${threadText}`;

  let supportIntent = normalizeSupportIntent(llmIntent);
  const heuristicIntent = detectIntentFromText(combined);
  if (
    heuristicIntent !== "none" &&
    (supportIntent === "none" || messageCategory === "product_inquiry")
  ) {
    supportIntent = heuristicIntent;
  }

  let supportUrgency = normalizeSupportUrgency(llmUrgency);
  const inboundFollowUps = countInboundAfterLastOutbound(context);
  if (inboundFollowUps >= 2 || FRUSTRATION_RE.test(targetText)) {
    supportUrgency = "high";
  } else if (supportIntent !== "none" && supportUrgency === "low") {
    supportUrgency = inboundFollowUps >= 1 ? "medium" : "medium";
  }

  return { supportIntent, supportUrgency };
}

export function hasActiveSupportIntent(signals: SupportSignals): boolean {
  return signals.supportIntent !== "none";
}
