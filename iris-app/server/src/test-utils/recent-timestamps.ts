/** Relative ISO timestamps for tests that depend on sliding windows (DM, import, max-age). */
export function secondsAgoIso(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
