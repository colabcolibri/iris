export const REPLY_MAX_AGE_DAYS_DEFAULT = 15;
export const REPLY_MAX_AGE_DAYS_MIN = 1;
export const REPLY_MAX_AGE_DAYS_MAX = 365;

export function normalizeReplyMaxAgeDays(value: number): number {
  return Math.min(
    REPLY_MAX_AGE_DAYS_MAX,
    Math.max(REPLY_MAX_AGE_DAYS_MIN, Math.round(value)),
  );
}

export function isValidReplyMaxAgeDays(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= REPLY_MAX_AGE_DAYS_MIN &&
    value <= REPLY_MAX_AGE_DAYS_MAX
  );
}
