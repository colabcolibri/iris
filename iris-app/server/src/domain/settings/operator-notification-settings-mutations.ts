import { ValidationError } from "../../api/json.ts";
import type { OperatorNotificationSettings } from "../notifications/operator-notification-types.ts";
import { normalizeAiLockDays } from "../messages/conversation-ai-lock.ts";

export function serializeOperatorNotificationSettings(
  settings: OperatorNotificationSettings,
) {
  return {
    channels: {
      email: {
        enabled: settings.channels.email.enabled,
        destination: settings.channels.email.destination,
      },
    },
    ai_lock_days: settings.aiLockDays,
    updated_at: settings.updatedAt,
  };
}

export function normalizeOperatorNotificationSettingsBody(
  body: Record<string, unknown>,
  current: OperatorNotificationSettings,
): Omit<OperatorNotificationSettings, "updatedAt"> {
  const channelsInput =
    body.channels && typeof body.channels === "object" && !Array.isArray(body.channels)
      ? (body.channels as Record<string, unknown>)
      : null;
  const emailInput =
    channelsInput?.email &&
    typeof channelsInput.email === "object" &&
    !Array.isArray(channelsInput.email)
      ? (channelsInput.email as Record<string, unknown>)
      : null;

  if (!emailInput) {
    throw new ValidationError("channels.email is required");
  }

  const enabled =
    "enabled" in emailInput ? emailInput.enabled === true : current.channels.email.enabled;
  const destination =
    typeof emailInput.destination === "string"
      ? emailInput.destination.trim()
      : current.channels.email.destination;

  if (enabled && !destination.includes("@")) {
    throw new ValidationError("channels.email.destination must be a valid email when enabled");
  }

  const aiLockDays =
    "ai_lock_days" in body
      ? normalizeAiLockDays(body.ai_lock_days)
      : "aiLockDays" in body
        ? normalizeAiLockDays(body.aiLockDays)
        : current.aiLockDays;

  return {
    channels: {
      email: {
        enabled,
        destination,
      },
    },
    aiLockDays,
  };
}
