import { readJsonBody, sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import {
  getAgentContentPayload,
  normalizeAgentContentBody,
  serializeAgentContent,
} from "../../domain/settings/agent-content.ts";

export const handleAgentContentSettingsRoute = createAdminPathRouter(
  "/api/settings/agent-content",
  {
    GET: async (match) => {
      sendJson(match.res, 200, getAgentContentPayload(match.ctx.agentContentStore));
    },
    PUT: async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req);
      const input = normalizeAgentContentBody(body);
      const saved = match.ctx.agentContentStore.upsert(input);
      sendJson(match.res, 200, serializeAgentContent(saved));
    },
  },
);
