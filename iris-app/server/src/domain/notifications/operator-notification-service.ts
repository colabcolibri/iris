import { buildOperatorNotificationEmailContent } from "./build-operator-notification-email.ts";
import type { EmailSender } from "../../ports/email-sender.ts";
import type { ServerAppLocale } from "../../i18n/locale.ts";
import type {
  OperatorNotificationChannelId,
  OperatorNotificationEvent,
  OperatorNotificationLogEntry,
  OperatorNotificationSettings,
} from "./operator-notification-types.ts";

export type OperatorNotificationChannel = {
  readonly id: OperatorNotificationChannelId;
  isEnabled(settings: OperatorNotificationSettings): boolean;
  send(
    settings: OperatorNotificationSettings,
    event: OperatorNotificationEvent,
  ): Promise<{ ok: boolean; recipient: string | null; error?: string }>;
};

export type OperatorNotificationLogRepository = {
  append(
    input: Omit<OperatorNotificationLogEntry, "id" | "createdAt"> & {
      id?: string;
      createdAt?: string;
    },
  ): OperatorNotificationLogEntry;
  listRecent(limit: number): OperatorNotificationLogEntry[];
};

export type OperatorNotificationSettingsStore = {
  get(): OperatorNotificationSettings | null;
  upsert(
    input: Omit<OperatorNotificationSettings, "updatedAt"> & { updatedAt?: string },
  ): OperatorNotificationSettings;
};

export type OperatorNotificationServiceDeps = {
  settingsStore: OperatorNotificationSettingsStore;
  logRepository: OperatorNotificationLogRepository;
  channels: OperatorNotificationChannel[];
};

export class OperatorNotificationService {
  private readonly deps: OperatorNotificationServiceDeps;

  constructor(deps: OperatorNotificationServiceDeps) {
    this.deps = deps;
  }

  async notify(event: OperatorNotificationEvent): Promise<OperatorNotificationLogEntry[]> {
    const settings = this.deps.settingsStore.get() ?? defaultOperatorNotificationSettings();
    const results: OperatorNotificationLogEntry[] = [];

    for (const channel of this.deps.channels) {
      if (!channel.isEnabled(settings)) {
        results.push(
          this.deps.logRepository.append({
            eventType: event.type,
            channel: channel.id,
            status: "skipped",
            payloadSummary: summarizeOperatorNotificationEvent(event),
            recipient: null,
            errorMessage: "channel_disabled",
          }),
        );
        continue;
      }

      const outcome = await channel.send(settings, event);
      results.push(
        this.deps.logRepository.append({
          eventType: event.type,
          channel: channel.id,
          status: outcome.ok ? "sent" : "failed",
          payloadSummary: summarizeOperatorNotificationEvent(event),
          recipient: outcome.recipient,
          errorMessage: outcome.ok ? null : outcome.error ?? "send_failed",
        }),
      );
    }

    return results;
  }
}

export function defaultOperatorNotificationSettings(): OperatorNotificationSettings {
  return {
    channels: {
      email: {
        enabled: false,
        destination: "",
      },
    },
    aiLockDays: 5,
    updatedAt: new Date().toISOString(),
  };
}

export function summarizeOperatorNotificationEvent(event: OperatorNotificationEvent): string {
  const parts = [
    `urgency=${event.urgency}`,
    `reason=${event.reason.slice(0, 200)}`,
    event.participantUsername ? `participant=@${event.participantUsername}` : null,
    event.conversationId ? `conversation=${event.conversationId}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

export function createEmailOperatorNotificationChannel(
  emailSender: EmailSender,
  options: { resolveAppLocale?: () => ServerAppLocale } = {},
): OperatorNotificationChannel {
  const resolveAppLocale = options.resolveAppLocale ?? (() => "pt" as ServerAppLocale);

  return {
    id: "email",
    isEnabled(settings) {
      return (
        settings.channels.email.enabled &&
        settings.channels.email.destination.trim().includes("@")
      );
    },
    async send(settings, event) {
      const recipient = settings.channels.email.destination.trim();
      const content = buildOperatorNotificationEmailContent(
        event,
        resolveAppLocale(),
      );

      const result = await emailSender.send({
        to: recipient,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });

      return {
        ok: result.ok,
        recipient,
        error: result.error,
      };
    },
  };
}
