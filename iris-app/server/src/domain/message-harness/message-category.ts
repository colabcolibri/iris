export const MESSAGE_CATEGORIES = [
  "product_inquiry",
  "general_unclear",
  "appreciation_sharing",
  "conversation_sharter",
  "harmful",
  "advice_help",
] as const;

export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number];

export function isMessageCategory(value: string): value is MessageCategory {
  return MESSAGE_CATEGORIES.includes(value as MessageCategory);
}

export function normalizeMessageCategory(value: unknown): MessageCategory {
  if (typeof value === "string" && isMessageCategory(value)) {
    return value;
  }
  return "general_unclear";
}
