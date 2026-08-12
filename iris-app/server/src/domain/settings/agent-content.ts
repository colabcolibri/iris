import type { AgentContent, AgentContentInput } from "../../ports/agent-content-store.ts";
import { ValidationError } from "../../api/json.ts";
import { defaultAgentContent } from "./agent-content-defaults.ts";

export const AGENT_CONTENT_MAX_CHARS = 32_000;

const FIELDS = ["soul", "page", "knowledge", "restrictions"] as const;

export type AgentContentField = (typeof FIELDS)[number];

export function normalizeAgentContentBody(body: Record<string, unknown>): AgentContentInput {
  const result: AgentContentInput = {
    soul: "",
    page: "",
    knowledge: "",
    restrictions: "",
  };

  for (const field of FIELDS) {
    const raw = body[field];
    if (raw === undefined) {
      throw new ValidationError(`${field} is required`);
    }
    if (typeof raw !== "string") {
      throw new ValidationError(`${field} must be a string`);
    }
    if (raw.length > AGENT_CONTENT_MAX_CHARS) {
      throw new ValidationError(`${field} exceeds ${AGENT_CONTENT_MAX_CHARS} characters`);
    }
    result[field] = raw;
  }

  return result;
}

export function serializeAgentContent(content: AgentContent) {
  return {
    soul: content.soul,
    page: content.page,
    knowledge: content.knowledge,
    restrictions: content.restrictions,
    updated_at: content.updatedAt,
  };
}

export function getAgentContentPayload(
  store: { get(): AgentContent | null },
): ReturnType<typeof serializeAgentContent> {
  const stored = store.get();
  if (stored) {
    return serializeAgentContent(stored);
  }

  const defaults = defaultAgentContent();
  return {
    ...serializeAgentContent(defaults),
    updated_at: null,
  };
}
