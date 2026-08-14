import { readJsonBody, sendError, sendJson } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { routeParam } from "../route-resources.ts";
import {
  resolveSimulateReplyInput,
  simulateReply,
} from "../../domain/agent-simulator/simulate-reply.ts";
import {
  resolveSimulateMessageReplyInput,
  simulateMessageReply,
} from "../../domain/agent-simulator/simulate-message-reply.ts";
import {
  mergeScenarioUpdate,
  normalizeSimulatorScenarioInput,
  serializeSimulatorScenario,
} from "../../domain/agent-simulator/simulator-scenario.ts";

export const handleAgentSimulatorRoute = createRouter([
  route("GET", "/api/agent/simulator-scenarios", { admin: true }, async (match) => {
    const items = match.ctx.simulatorScenarioStore.list().map(serializeSimulatorScenario);
    sendJson(match.res, 200, { items });
  }),

  route("POST", "/api/agent/simulator-scenarios", { admin: true }, async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const input = normalizeSimulatorScenarioInput(body, { requireId: true });
    const created = match.ctx.simulatorScenarioStore.create(input);
    sendJson(match.res, 201, serializeSimulatorScenario(created));
  }),

  route(
    "PUT",
    /^\/api\/agent\/simulator-scenarios\/([^/]+)$/,
    { admin: true },
    async (match) => {
      const id = routeParam(match, "id");
      const existing = match.ctx.simulatorScenarioStore.getById(id);
      if (!existing) {
        sendError(match.res, 404, "simulator scenario not found");
        return;
      }

      const body = await readJsonBody<Record<string, unknown>>(match.req);
      const input = mergeScenarioUpdate(existing, body);
      const updated = match.ctx.simulatorScenarioStore.update(id, input);
      sendJson(match.res, 200, serializeSimulatorScenario(updated!));
    },
    { paramNames: ["id"] },
  ),

  route(
    "DELETE",
    /^\/api\/agent\/simulator-scenarios\/([^/]+)$/,
    { admin: true },
    async (match) => {
      const id = routeParam(match, "id");
      const deleted = match.ctx.simulatorScenarioStore.delete(id);
      if (!deleted) {
        sendError(match.res, 404, "simulator scenario not found");
        return;
      }

      sendJson(match.res, 200, { ok: true });
    },
    { paramNames: ["id"] },
  ),

  route("POST", "/api/agent/simulate", { admin: true }, async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const channel =
      body.channel === "dm" || body.channel === "message" ? "dm" : "comment";

    if (channel === "dm") {
      const input = resolveSimulateMessageReplyInput(body);
      const result = await simulateMessageReply(input, {
        personaStore: match.ctx.replyPersonaStore,
        messageAgentContentStore: match.ctx.messageAgentContentStore,
        products: match.ctx.products,
        productStoreLinks: match.ctx.productStoreLinks,
        productFieldPolicies: match.ctx.productFieldPolicies,
        storeConnections: match.ctx.storeConnections,
        storeProviders: match.ctx.storeProviders,
        emailSender: match.ctx.emailSender,
        appSettingsStore: match.ctx.appSettingsStore,
        operatorNotificationSettingsStore: match.ctx.operatorNotificationSettingsStore,
        operatorNotificationLogRepository: match.ctx.operatorNotificationLogRepository,
        publicBaseUrl: match.ctx.publicBaseUrl,
        llm: match.ctx.resolveLlmCompleter(),
        agentRuns: match.ctx.agentRuns,
        agentRunSteps: match.ctx.agentRunSteps,
      });
      sendJson(match.res, 200, result);
      return;
    }

    const input = resolveSimulateReplyInput(body, {
      scenarioStore: match.ctx.simulatorScenarioStore,
    });
    const result = await simulateReply(input, {
      personaStore: match.ctx.replyPersonaStore,
      agentContentStore: match.ctx.agentContentStore,
      llm: match.ctx.resolveLlmCompleter(),
      agentRuns: match.ctx.agentRuns,
      agentRunSteps: match.ctx.agentRunSteps,
    });

    sendJson(match.res, 200, result);
  }),
]);
