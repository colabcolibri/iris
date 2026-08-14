import {
  AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS,
  AGENT_REPLY_DEBOUNCE_MAX_SECONDS,
  AGENT_REPLY_DEBOUNCE_MIN_SECONDS,
  computeAgentReplyDebounceNotBefore,
  isValidAgentReplyDebounceSeconds,
  normalizeAgentReplyDebounceSeconds,
} from "../agent-reply/agent-reply-debounce.ts";

/** @deprecated use AGENT_REPLY_DEBOUNCE_MIN_SECONDS */
export const REPLY_DELAY_MIN_SECONDS = AGENT_REPLY_DEBOUNCE_MIN_SECONDS;
/** @deprecated use AGENT_REPLY_DEBOUNCE_MAX_SECONDS */
export const REPLY_DELAY_MAX_SECONDS = AGENT_REPLY_DEBOUNCE_MAX_SECONDS;

export function isValidReplyDelaySeconds(value: number): boolean {
  return isValidAgentReplyDebounceSeconds(value);
}

export function normalizeReplyDelaySeconds(value: number): number {
  return normalizeAgentReplyDebounceSeconds(value);
}

export function computeAgentReplyNotBefore(now: Date, delaySeconds: number): string {
  return computeAgentReplyDebounceNotBefore(now, delaySeconds);
}

export {
  AGENT_REPLY_DEBOUNCE_DEFAULT_SECONDS,
  AGENT_REPLY_DEBOUNCE_MAX_SECONDS,
  AGENT_REPLY_DEBOUNCE_MIN_SECONDS,
};
