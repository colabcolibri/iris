import { readJsonBody, sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import {
  getOperatorNotificationSettingsOrDefault,
} from "../../adapters/sqlite/operator-notification-settings-repository.ts";
import {
  defaultOperatorNotificationSettings,
  OperatorNotificationService,
  createEmailOperatorNotificationChannel,
  summarizeOperatorNotificationEvent,
} from "../../domain/notifications/operator-notification-service.ts";
import {
  normalizeOperatorNotificationSettingsBody,
  serializeOperatorNotificationSettings,
} from "../../domain/settings/operator-notification-settings-mutations.ts";

export const handleOperatorNotificationSettingsRoute = createAdminPathRouter(
  "/api/settings/operator-notifications",
  {
    GET: async (match) => {
      const settings = getOperatorNotificationSettingsOrDefault(
        match.ctx.operatorNotificationSettingsStore,
      );
      sendJson(match.res, 200, serializeOperatorNotificationSettings(settings));
    },
    PUT: async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req);
      const current =
        match.ctx.operatorNotificationSettingsStore.get() ??
        defaultOperatorNotificationSettings();
      const input = normalizeOperatorNotificationSettingsBody(body, current);
      const saved = match.ctx.operatorNotificationSettingsStore.upsert(input);
      sendJson(match.res, 200, serializeOperatorNotificationSettings(saved));
    },
  },
);

export const handleOperatorNotificationTestRoute = createAdminPathRouter(
  "/api/settings/operator-notifications/test",
  {
    POST: async (match) => {
      const service = new OperatorNotificationService({
        settingsStore: match.ctx.operatorNotificationSettingsStore,
        logRepository: match.ctx.operatorNotificationLogRepository,
        channels: [
          createEmailOperatorNotificationChannel(match.ctx.emailSender, {
            resolveAppLocale: () =>
              getAppSettingsOrDefault(match.ctx.appSettingsStore).adminLocale,
          }),
        ],
      });

      const logs = await service.notify({
        type: "operator_attention_required",
        urgency: "low",
        reason: "Teste de notificação do operador",
        customerSummary: "Mensagem de teste enviada pelo admin Iris.",
        suggestedNextStep: "Nenhuma ação necessária — apenas validação.",
        participantUsername: "cliente_teste",
        inboundMessageText: "Não consigo finalizar minha compra, pode me ajudar?",
        messageTimestamp: new Date().toISOString(),
      });

      const last = logs.at(-1);
      sendJson(match.res, 200, {
        ok: last?.status === "sent",
        status: last?.status ?? "failed",
        summary: last ? summarizeOperatorNotificationEvent({
          type: "operator_attention_required",
          urgency: "low",
          reason: "test",
          customerSummary: "test",
        }) : null,
      });
    },
  },
);
