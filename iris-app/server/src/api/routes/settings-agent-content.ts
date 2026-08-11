import { readJsonBody, sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import { defaultAgentContent } from "../../domain/settings/agent-content-defaults.ts";
import { normalizeAgentContentBody } from "../../domain/settings/agent-content.ts";
import type { AgentContent } from "../../ports/agent-content-store.ts";

function serializeAgentContent(content: AgentContent) {
  return {
    soul: content.soul,
    page: content.page,
    knowledge: content.knowledge,
    restrictions: content.restrictions,
    updated_at: content.updatedAt,
  };
}

export const handleAgentContentSettingsRoute = createAdminPathRouter(
  "/api/settings/agent-content",
  {
    GET: async (match) => {
      const stored = match.ctx.agentContentStore.get();
      if (stored) {
        sendJson(match.res, 200, serializeAgentContent(stored));
        return;
      }

      const defaults = defaultAgentContent();
      sendJson(match.res, 200, {
        ...serializeAgentContent(defaults),
        updated_at: null,
      });
    },
    PUT: async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req);
      const input = normalizeAgentContentBody(body);
      const saved = match.ctx.agentContentStore.upsert(input);
      sendJson(match.res, 200, serializeAgentContent(saved));
    },
  },
);
