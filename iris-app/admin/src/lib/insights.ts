import { formatNumber } from "@/i18n/formatting";
import type { AppLocale } from "@/i18n/types";

export function formatInsightMetricName(
  name: string,
  labels: Record<string, string>,
): string {
  return labels[name] ?? name;
}

export function formatInsightValue(value: number, locale: AppLocale): string {
  return formatNumber(value, locale);
}

export function insightMetricValue(
  metrics:
    | Array<{ name: string; values: Array<{ value: number }> }>
    | undefined,
  name: string,
): number | null {
  const metric = metrics?.find((item) => item.name === name);
  const value = metric?.values[0]?.value;
  return typeof value === "number" ? value : null;
}
