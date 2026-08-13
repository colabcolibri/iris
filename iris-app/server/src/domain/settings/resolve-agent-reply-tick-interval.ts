import type { AppSettings } from "../../ports/app-settings-store.ts";
import { normalizeAgentReplyTickIntervalSeconds } from "./agent-reply-tick-settings.ts";

export function resolveAgentReplyTickIntervalMs(settings: AppSettings): number {
  return normalizeAgentReplyTickIntervalSeconds(settings.agentReplyTickIntervalSeconds) * 1000;
}
