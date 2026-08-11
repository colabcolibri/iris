/** Intervalo padrão: 5 minutos. */
export const AUTO_MONITOR_INTERVAL_DEFAULT_SECONDS = 300;
export const AUTO_MONITOR_INTERVAL_MIN_SECONDS = 60;
export const AUTO_MONITOR_INTERVAL_MAX_SECONDS = 3600;
export const AUTO_MONITOR_MEDIA_LIMIT_DEFAULT = 20;

export function isValidAutoMonitorIntervalSeconds(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  const seconds = Math.round(value);
  return (
    seconds >= AUTO_MONITOR_INTERVAL_MIN_SECONDS &&
    seconds <= AUTO_MONITOR_INTERVAL_MAX_SECONDS
  );
}

export function normalizeAutoMonitorIntervalSeconds(value: number): number {
  return Math.min(
    AUTO_MONITOR_INTERVAL_MAX_SECONDS,
    Math.max(AUTO_MONITOR_INTERVAL_MIN_SECONDS, Math.round(value)),
  );
}
