const METRIC_LABELS: Record<string, string> = {
  reach: "Alcance",
  views: "Visualizações",
  likes: "Curtidas",
  comments: "Comentários",
  saved: "Salvos",
  impressions: "Impressões",
  shares: "Compartilhamentos",
};

export function formatInsightMetricName(name: string): string {
  return METRIC_LABELS[name] ?? name;
}

export function formatInsightValue(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function insightMetricValue(
  metrics: Array<{ name: string; values: Array<{ value: number }> }> | undefined,
  name: string,
): number | null {
  const metric = metrics?.find((item) => item.name === name);
  const value = metric?.values[0]?.value;
  return typeof value === "number" ? value : null;
}
