import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createLoggingEmailSender } from "../../adapters/email/logging-email-sender.ts";
import { createSqliteOperatorNotificationLogRepository } from "../../adapters/sqlite/operator-notification-log-repository.ts";
import { createSqliteOperatorNotificationSettingsStore } from "../../adapters/sqlite/operator-notification-settings-repository.ts";
import {
  OperatorNotificationService,
  createEmailOperatorNotificationChannel,
} from "./operator-notification-service.ts";

describe("operator notification service", () => {
  test("sends email when channel enabled and logs outcome", async () => {
    const db = new DatabaseSync(":memory:");
    runMigrations(db);
    const settingsStore = createSqliteOperatorNotificationSettingsStore(db);
    const logRepository = createSqliteOperatorNotificationLogRepository(db);
    settingsStore.upsert({
      channels: {
        email: { enabled: true, destination: "ops@example.com" },
      },
      aiLockDays: 5,
    });

    const service = new OperatorNotificationService({
      settingsStore,
      logRepository,
      channels: [createEmailOperatorNotificationChannel(createLoggingEmailSender())],
    });

    const logs = await service.notify({
      type: "operator_attention_required",
      urgency: "high",
      reason: "Cliente frustrado",
      customerSummary: "Não consigo comprar",
    });

    assert.equal(logs.length, 1);
    assert.equal(logs[0]?.status, "sent");
    assert.equal(logs[0]?.recipient, "ops@example.com");
  });

  test("skips disabled channel", async () => {
    const db = new DatabaseSync(":memory:");
    runMigrations(db);
    const settingsStore = createSqliteOperatorNotificationSettingsStore(db);
    const logRepository = createSqliteOperatorNotificationLogRepository(db);

    const service = new OperatorNotificationService({
      settingsStore,
      logRepository,
      channels: [createEmailOperatorNotificationChannel(createLoggingEmailSender())],
    });

    const logs = await service.notify({
      type: "operator_attention_required",
      urgency: "low",
      reason: "teste",
      customerSummary: "teste",
    });

    assert.equal(logs[0]?.status, "skipped");
  });
});
