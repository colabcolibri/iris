import { readJsonBody, sendJson, ValidationError } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import {
  getMessageAgentContentPayload,
  normalizeMessageAgentContentBody,
  serializeMessageAgentContent,
} from "../../domain/settings/message-agent-content.ts";
import { getMessageAgentContentOrDefault } from "../../domain/settings/message-agent-content-defaults.ts";

export const handleMessageAgentContentSettingsRoute = createAdminPathRouter(
  "/api/settings/message-agent-content",
  {
    GET: async (match) => {
      sendJson(
        match.res,
        200,
        getMessageAgentContentPayload(match.ctx.messageAgentContentStore),
      );
    },
    PUT: async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req);
      const current = getMessageAgentContentOrDefault(match.ctx.messageAgentContentStore);
      const input = normalizeMessageAgentContentBody(body, current);
      const saved = match.ctx.messageAgentContentStore.upsert(input);
      sendJson(match.res, 200, serializeMessageAgentContent(saved));
    },
  },
);
