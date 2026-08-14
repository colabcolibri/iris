import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/i18n/provider";
import {
  estimateLlmTokens,
  formatTokenEstimate,
} from "@/lib/estimate-llm-tokens";

export type SimulatorContentStatField = {
  key: string;
  label: string;
  tokens: number;
};

type SimulatorContentStatsProps = {
  fields: SimulatorContentStatField[];
  loaded: boolean;
  personaHref: string;
  personaLinkLabel: string;
  tokenEstimateTitle: string;
  tokenEstimateMessages: {
    empty: string;
    tokensK: string;
    tokens: string;
  };
};

export function SimulatorContentStats({
  fields,
  loaded,
  personaHref,
  personaLinkLabel,
  tokenEstimateTitle,
  tokenEstimateMessages,
}: SimulatorContentStatsProps) {
  const { locale } = useAppLocale();

  return (
    <div className="flex flex-wrap gap-1.5">
      {fields.map((field) => {
        const populated = field.tokens > 0;
        return (
          <span
            key={field.key}
            className={cn(
              "rounded-(--iris-radius-sm) border px-2 py-0.5 text-xs",
              populated
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border text-muted-foreground",
            )}
            title={tokenEstimateTitle}
          >
            {field.label}:{" "}
            {loaded
              ? formatTokenEstimate(field.tokens, locale, tokenEstimateMessages)
              : "…"}
          </span>
        );
      })}
      <Link
        to={personaHref}
        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        {personaLinkLabel}
      </Link>
    </div>
  );
}

export function buildContentStatFields(
  labels: Record<string, string>,
  values: Record<string, string | null | undefined>,
): SimulatorContentStatField[] {
  return Object.entries(labels).map(([key, label]) => ({
    key,
    label,
    tokens: estimateLlmTokens(values[key] ?? ""),
  }));
}
