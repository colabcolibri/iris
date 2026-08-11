import type { AgentContentInput } from "../../ports/agent-content-store.ts";
import { ValidationError } from "../../api/json.ts";

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
