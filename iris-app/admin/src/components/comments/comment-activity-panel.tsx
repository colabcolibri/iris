import { useCallback, useEffect, useState } from "react";
import { Clock3, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCommentActivity } from "@/lib/api";
import { formatRelativeTimeAgo, useRelativeTimeTick } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { CommentActivityItem, CommentActivityKind } from "@/lib/types";

type CommentActivityPanelProps = {
  onSelect: (item: CommentActivityItem) => void;
  refreshToken?: number;
};

const TABS: Array<{
  kind: CommentActivityKind;
  label: string;
  empty: string;
}> = [
  {
    kind: "pending_approval",
    label: "Aprovação",
    empty: "Nenhum rascunho aguardando aprovação.",
  },
  {
    kind: "recent_public",
    label: "Público",
    empty: "Nenhum comentário recente do público.",
  },
  {
    kind: "recent_iris",
    label: "Iris",
    empty: "Nenhuma resposta recente publicada pela Iris.",
  },
];

function formatHandle(username: string | null | undefined): string {
  const value = username?.trim() || "usuário";
  return value.startsWith("@") ? value : `@${value}`;
}

function ActivityTimestamp({ value }: { value: string }) {
  useRelativeTimeTick();
  const relative = formatRelativeTimeAgo(value);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock3 className="size-3 shrink-0" aria-hidden />
      <span>{relative || "agora"}</span>
    </span>
  );
}

function ActivityListItem({
  item,
  kind,
  onSelect,
}: {
  item: CommentActivityItem;
  kind: CommentActivityKind;
  onSelect: (item: CommentActivityItem) => void;
}) {
  const preview =
    kind === "pending_approval"
      ? item.draft_text_preview ?? item.text_preview
      : kind === "recent_iris"
        ? item.sent_text_preview ?? item.text_preview
        : item.text_preview;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full flex-col gap-2 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {formatHandle(item.author_username)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{preview}</p>
        </div>
        {item.post_pending_count > 0 ? (
          <Badge className="shrink-0 bg-amber-500 text-white hover:bg-amber-500/90">
            {item.post_pending_count}
          </Badge>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {item.post_caption_preview || item.ig_media_id || item.post_id}
        </p>
        <ActivityTimestamp value={item.occurred_at} />
      </div>
    </button>
  );
}

export function CommentActivityPanel({ onSelect, refreshToken = 0 }: CommentActivityPanelProps) {
  const [activeKind, setActiveKind] = useState<CommentActivityKind>("pending_approval");
  const [items, setItems] = useState<CommentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async (kind: CommentActivityKind) => {
    setLoading(true);
    setError(null);
    try {
      const nextItems = await fetchCommentActivity(kind);
      setItems(nextItems);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar atividade.";
      setError(message);
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
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              onClick={() => setActiveKind(tab.kind)}
              className={cn(
                "rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
                activeKind === tab.kind
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando…
          </div>
        ) : error ? (
          <div className="space-y-3 px-4 py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void loadActivity(activeKind)}>
              Tentar novamente
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            {activeKind === "pending_approval" ? (
              <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            ) : (
              <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            )}
            <p className="text-sm text-muted-foreground">{activeTab.empty}</p>
          </div>
        ) : (
          items.map((item) => (
            <ActivityListItem key={`${activeKind}-${item.comment_id}`} item={item} kind={activeKind} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  );
}
