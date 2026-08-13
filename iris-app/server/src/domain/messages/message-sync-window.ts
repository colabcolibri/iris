export const MESSAGE_IMPORT_MAX_AGE_DAYS = 30;

export const MESSAGE_IMPORT_MAX_AGE_MS =
  MESSAGE_IMPORT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export function messageImportCutoffMs(now = Date.now()): number {
  return now - MESSAGE_IMPORT_MAX_AGE_MS;
}

export function messageImportCutoffIso(now = Date.now()): string {
  return new Date(messageImportCutoffMs(now)).toISOString();
}

export function isWithinMessageImportWindow(
  iso: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!iso) {
    return true;
  }

  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return true;
  }

  return timestamp >= messageImportCutoffMs(now);
}
