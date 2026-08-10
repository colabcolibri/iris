import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fetchMetaTestConversations,
  fetchMetaTestInsights,
} from "@/lib/api";
import type { MetaStatus, MetaTestConversationsResult, MetaTestInsightsResult } from "@/lib/types";

type ChecklistStatus = "done" | "action" | "pending";

type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  hint: string;
  href?: string;
};

type MetaReviewCardProps = {
  meta: MetaStatus | null;
  onMetaHealth?: () => void;
};

function formatInsightsSummary(result: MetaTestInsightsResult): string {
  if (!result.ok || !result.insights?.length) {
    return result.message ?? "Sem métricas retornadas.";
  }
  return result.insights
    .slice(0, 4)
    .map((metric) => {
      const value = metric.values[0]?.value ?? 0;
      return `${metric.name}: ${value}`;
    })
    .join(" · ");
}

export function MetaReviewCard({ meta, onMetaHealth }: MetaReviewCardProps) {
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [insightsResult, setInsightsResult] = useState<MetaTestInsightsResult | null>(null);
  const [conversationsResult, setConversationsResult] =
    useState<MetaTestConversationsResult | null>(null);

  const connected = Boolean(meta?.connected);

  const runInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const result = await fetchMetaTestInsights();
      setInsightsResult(result);
      if (result.ok) {
        toast.success("Insights consultados com sucesso.");
      } else {
        toast.error(result.message ?? "Falha ao consultar insights.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao consultar insights.");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const runConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const result = await fetchMetaTestConversations(5);
      setConversationsResult(result);
      if (result.ok) {
        toast.success(`${result.count ?? 0} conversa(s) listada(s).`);
      } else if (result.code === "unsupported") {
        toast.message("Conversas indisponíveis neste tipo de login — veja a documentação.");
      } else {
        toast.error(result.message ?? "Falha ao listar conversas.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao listar conversas.");
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const checklist: ChecklistItem[] = [
    {
      id: "basic",
      label: "instagram_business_basic",
      status: connected ? "done" : "pending",
      hint: connected ? "Conta conectada." : "Conecte o Instagram no header.",
    },
    {
      id: "publish",
      label: "instagram_business_content_publish",
      status: "action",
      hint: "Agende um post de teste no calendário e apague no Instagram depois.",
      href: "/",
    },
    {
      id: "comments",
      label: "instagram_business_manage_comments",
      status: "done",
      hint: "Webhooks e respostas já operam no Iris.",
      href: "/webhooks",
    },
    {
      id: "insights",
      label: "instagram_business_manage_insights",
      status: insightsResult?.ok ? "done" : "action",
      hint: "Use o botão Testar insights abaixo.",
    },
    {
      id: "messages",
      label: "instagram_business_manage_messages",
      status: conversationsResult?.ok ? "done" : "action",
      hint: "Use o botão Testar mensagens abaixo.",
    },
    {
      id: "profile",
      label: "public_profile",
      status: "action",
      hint: "Use Testar conexão no menu Instagram do header.",
    },
    {
      id: "legacy-comments",
      label: "instagram_manage_comments (legado)",
      status: "action",
      hint: "Responda um comentário em Comentários ou via webhook.",
      href: "/comments",
    },
    {
      id: "human-agent",
      label: "Human Agent",
      status: "action",
      hint: "Relacionado a mensagens; avance manage_messages primeiro.",
    },
  ];

  return (
    <Card className="space-y-5 border-border/80 bg-card/90 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold">Testes Meta (revisão do app)</h2>
        <p className="text-xs text-muted-foreground">
          Execute chamadas de API exigidas pelo painel IGIris na Meta Developers. Após deploy com
          novos scopes, use <strong>Trocar conta</strong> no header.
        </p>
      </header>

      {!connected ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Conecte o Instagram antes de rodar os testes.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!connected || insightsLoading}
          onClick={() => void runInsights()}
        >
          {insightsLoading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Testar insights
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!connected || conversationsLoading}
          onClick={() => void runConversations()}
        >
          {conversationsLoading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Testar mensagens
        </Button>
        {onMetaHealth ? (
          <Button type="button" variant="outline" size="sm" onClick={onMetaHealth}>
            Testar conexão (public_profile)
          </Button>
        ) : null}
      </div>

      {insightsResult ? (
        <p
          className={`text-xs ${insightsResult.ok ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}
        >
          Insights: {formatInsightsSummary(insightsResult)}
          {insightsResult.media_id ? ` · mídia ${insightsResult.media_id}` : ""}
        </p>
      ) : null}

      {conversationsResult ? (
        <p
          className={`text-xs ${conversationsResult.ok ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}
        >
          Mensagens:{" "}
          {conversationsResult.ok
            ? `${conversationsResult.count ?? 0} conversa(s) retornada(s).`
            : conversationsResult.message}
        </p>
      ) : null}

      <ul className="space-y-2">
        {checklist.map((item) => {
          const Icon =
            item.status === "done" ? CheckCircle2 : Circle;
          const iconClass =
            item.status === "done"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground";

          return (
            <li
              key={item.id}
              className="flex gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-xs"
            >
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconClass}`} />
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium break-all">{item.label}</p>
                <p className="text-muted-foreground">{item.hint}</p>
                {item.href ? (
                  <Link to={item.href} className="text-primary underline-offset-4 hover:underline">
                    Abrir
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
