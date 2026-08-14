export const DEBOUNCE_PRESET_MINUTES = [1, 2, 3, 5, 10, 20, 30, 60] as const;

export const DEBOUNCE_MIN_MINUTES = 1;
export const DEBOUNCE_MAX_MINUTES = 60;
export const DEBOUNCE_DEFAULT_MINUTES = 1;

export function minutesToDebounceSeconds(minutes: number): number {
  return Math.round(minutes) * 60;
}

export function debounceSecondsToMinutes(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return DEBOUNCE_DEFAULT_MINUTES;
  }
  return Math.max(DEBOUNCE_MIN_MINUTES, Math.round(seconds / 60));
}

export function clampDebounceMinutes(rawMinutes: number): number {
  const parsed = Number.isFinite(rawMinutes)
    ? Math.round(rawMinutes)
    : DEBOUNCE_DEFAULT_MINUTES;
  return Math.min(
    DEBOUNCE_MAX_MINUTES,
    Math.max(DEBOUNCE_MIN_MINUTES, parsed || DEBOUNCE_DEFAULT_MINUTES),
  );
}

export function formatDebounceMinutesLabel(minutes: number): string {
  return minutes === 1 ? "1 min" : `${minutes} min`;
}
