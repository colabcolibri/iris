import { useCallback, useEffect, useState } from "react";
import { Clock3, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { fetchMessageActivity } from "@/lib/api";
import {
  formatRelativeTimeAgo,
  useRelativeTimeTick,
} from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { MessageActivityItem, MessageActivityKind } from "@/lib/types";

type MessageActivityPanelProps = {
  onSelect: (item: MessageActivityItem) => void;
  refreshToken?: number;
};

const TABS: Array<{
  kind: MessageActivityKind;
  label: string;
  empty: string;
}> = [
  {
    kind: "pending_approval",
    label: "Aprovação",
    empty: "Nenhum rascunho aguardando aprovação.",
  },
  {
    kind: "recent",
    label: "Recentes",
    empty: "Nenhuma resposta recente em DM.",
  },
];

function formatHandle(username: string | null | undefined): string {
  const value = username?.trim() || "usuário";
  return value.startsWith("@") ? value : `@${value}`;
}

function ActivityTimestamp({ value }: { value: string }) {
  useRelativeTimeTick();
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock3 className="size-3 shrink-0" aria-hidden />
      {formatRelativeTimeAgo(value) || "agora"}
    </span>
  );
}

export function MessageActivityPanel({
  onSelect,
  refreshToken = 0,
}: MessageActivityPanelProps) {
  const [activeKind, setActiveKind] =
    useState<MessageActivityKind>("pending_approval");
  const [items, setItems] = useState<MessageActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async (kind: MessageActivityKind) => {
    setLoading(true);
    setError(null);
    try {
      const nextItems = await fetchMessageActivity(kind);
      setItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar atividade.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivity(activeKind);
  }, [activeKind, loadActivity, refreshToken]);

  const activeTab = TABS.find((tab) => tab.kind === activeKind) ?? TABS[0]!;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 p-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              onClick={() => setActiveKind(tab.kind)}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                activeKind === tab.kind
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <PageScrollArea>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-base text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando…
          </div>
        ) : error ? (
          <div className="space-y-3 px-4 py-6 text-center">
            <p className="text-base text-destructive">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadActivity(activeKind)}
            >
              Tentar novamente
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            {activeKind === "pending_approval" ? (
              <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            ) : (
              <MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            )}
            <p className="text-base text-muted-foreground">{activeTab.empty}</p>
          </div>
        ) : (
          items.map((item) => {
            const preview =
              activeKind === "pending_approval"
                ? (item.draft_text_preview ?? item.text_preview)
                : (item.sent_text_preview ?? item.text_preview);
            return (
              <button
                key={`${activeKind}-${item.message_id}`}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full flex-col gap-2 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {formatHandle(item.participant_username)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
                      {preview}
                    </p>
                  </div>
                  {item.conversation_pending_count > 0 ? (
                    <Badge className="shrink-0 bg-amber-500 text-white hover:bg-amber-500/90">
                      {item.conversation_pending_count}
                    </Badge>
                  ) : null}
                </div>
                <ActivityTimestamp value={item.occurred_at} />
              </button>
            );
          })
        )}
      </PageScrollArea>
    </div>
  );
}
