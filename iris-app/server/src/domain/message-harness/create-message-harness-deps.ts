import type { AppContext } from "../../api/app-context.ts";
import type { EmailSender } from "../../ports/email-sender.ts";
import type { HarnessOperatorNotificationContext } from "../../ports/harness-tool.ts";
import {
  createDefaultHarnessToolRegistry,
  createHarnessToolContext,
} from "../harness/bootstrap-harness-tools.ts";
import { DEFAULT_HARNESS_BUDGET } from "../harness/types.ts";
import type { AppSettingsStore } from "../../ports/app-settings-store.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import {
  OperatorNotificationService,
  createEmailOperatorNotificationChannel,
  type OperatorNotificationLogRepository,
  type OperatorNotificationSettingsStore,
} from "../notifications/operator-notification-service.ts";
import type { MessageAgenticDraftDeps } from "../message-harness/agentic-draft-stage.ts";

export type MessageHarnessCatalogDeps = {
  products: AppContext["products"];
  productStoreLinks: AppContext["productStoreLinks"];
  productFieldPolicies: AppContext["productFieldPolicies"];
  storeConnections: AppContext["storeConnections"];
  storeProviders: AppContext["storeProviders"];
  emailSender: EmailSender;
  appSettingsStore: AppSettingsStore;
  operatorNotificationSettingsStore: OperatorNotificationSettingsStore;
  operatorNotificationLogRepository: OperatorNotificationLogRepository;
  publicBaseUrl?: string | null;
};

export type MessageHarnessRuntimeContext = HarnessOperatorNotificationContext;

export function createMessageHarnessDeps(
  ctx: MessageHarnessCatalogDeps,
  runtime: MessageHarnessRuntimeContext = {},
): MessageAgenticDraftDeps {
  const notificationService = new OperatorNotificationService({
    settingsStore: ctx.operatorNotificationSettingsStore,
    logRepository: ctx.operatorNotificationLogRepository,
    channels: [
      createEmailOperatorNotificationChannel(ctx.emailSender, {
        resolveAppLocale: () => getAppSettingsOrDefault(ctx.appSettingsStore).adminLocale,
      }),
    ],
  });

  const adminDeepLink =
    runtime.conversationId && ctx.publicBaseUrl
      ? `${ctx.publicBaseUrl.replace(/\/$/, "")}/admin/messages?conversation=${encodeURIComponent(runtime.conversationId)}`
      : runtime.adminDeepLink ?? null;

  return {
    registry: createDefaultHarnessToolRegistry(),
    toolContext: createHarnessToolContext(
      {
        products: ctx.products,
        productStoreLinks: ctx.productStoreLinks,
        productFieldPolicies: ctx.productFieldPolicies,
        storeConnections: ctx.storeConnections,
        storeProviders: ctx.storeProviders,
        operatorNotification: {
          service: notificationService,
          context: {
            ...runtime,
            adminDeepLink,
          },
        },
      },
      DEFAULT_HARNESS_BUDGET,
    ),
  };
}
