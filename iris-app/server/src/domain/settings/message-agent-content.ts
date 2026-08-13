import { ValidationError } from "../../api/json.ts";
import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";
import { getMessageAgentContentOrDefault } from "./message-agent-content-defaults.ts";

const MAX_BLOCK_CHARS = 32_000;

function readBlock(body: Record<string, unknown>, key: string, current: string): string {
  if (!(key in body)) {
    return current;
  }
  const value = body[key];
  if (typeof value !== "string") {
    throw new ValidationError(`${key} must be a string`);
  }
  if (value.length > MAX_BLOCK_CHARS) {
    throw new ValidationError(`${key} exceeds maximum length`);
  }
  return value;
}

export function getMessageAgentContentPayload(
  store: { get(): MessageAgentContent | null },
) {
  return serializeMessageAgentContent(getMessageAgentContentOrDefault(store));
}

export function serializeMessageAgentContent(content: MessageAgentContent) {
  return {
    dm_soul: content.dmSoul,
    dm_page: content.dmPage,
    dm_knowledge: content.dmKnowledge,
    dm_restrictions: content.dmRestrictions,
    updated_at: content.updatedAt,
  };
}

export function normalizeMessageAgentContentBody(
  body: Record<string, unknown>,
  current: MessageAgentContent,
): Omit<MessageAgentContent, "updatedAt"> {
  return {
    dmSoul: readBlock(body, "dm_soul", current.dmSoul),
    dmPage: readBlock(body, "dm_page", current.dmPage),
    dmKnowledge: readBlock(body, "dm_knowledge", current.dmKnowledge),
    dmRestrictions: readBlock(body, "dm_restrictions", current.dmRestrictions),
  };
}
