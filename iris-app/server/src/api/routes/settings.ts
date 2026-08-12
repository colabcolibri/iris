import { readJsonBody, sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import {
  getReplyPersonaPayload,
  normalizePersonaBody,
  serializePersona,
} from "../../domain/settings/reply-persona-mutations.ts";

export const handleSettingsRoute = createAdminPathRouter("/api/settings/reply-persona", {
  GET: async (match) => {
    sendJson(match.res, 200, getReplyPersonaPayload(match.ctx.replyPersonaStore));
  },
  PUT: async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const input = normalizePersonaBody(body);
    const saved = match.ctx.replyPersonaStore.upsert(input);
    sendJson(match.res, 200, serializePersona(saved));
  },
});
