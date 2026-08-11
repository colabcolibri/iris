import { useEffect, useState } from "react";

export function formatRelativeTimeAgo(
  value: string | number | Date | null | undefined,
  now = Date.now(),
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const ms =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : Date.parse(value);

  if (Number.isNaN(ms)) {
    return null;
  }

  const diffSec = Math.max(0, Math.floor((now - ms) / 1000));

  if (diffSec < 10) {
    return "agora";
  }
  if (diffSec < 60) {
    return `há ${diffSec} segundos`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `há ${diffMin} minuto${diffMin === 1 ? "" : "s"}`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `há ${diffHour} hora${diffHour === 1 ? "" : "s"}`;
  }

  const diffDay = Math.floor(diffHour / 24);
  return `há ${diffDay} dia${diffDay === 1 ? "" : "s"}`;
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
