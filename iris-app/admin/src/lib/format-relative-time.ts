import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/i18n/formatting";
import type { AppLocale } from "@/i18n/types";

export function formatRelativeTimeAgo(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
  now = Date.now(),
): string | null {
  return formatRelativeTime(value, locale, now);
}

export function useRelativeTimeTick(intervalMs = 30_000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick((current) => current + 1);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return tick;
}
