import { useState } from "react";
import {
  BarChart3,
  Bookmark,
  ExternalLink,
  Eye,
  Hash,
  Heart,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { PostMediaCarousel } from "@/components/comments/post-media-carousel";
import { CommentThread } from "@/components/comments/comment-thread";
import { CarouselSummaryEditor } from "@/components/comments/carousel-summary-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { resolveMediaSlides } from "@/hooks/use-post-preview";
import { formatInsightValue, insightMetricValue } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { CommentThreadGroup, ThreadSortMode } from "@/lib/build-comment-tree";
import type { Comment, CommentPostSummary, PostInsightsResult } from "@/lib/types";
import { ThreadSortSelect } from "@/components/comments/thread-sort-select";

type PostDetailPanelProps = {
  post: CommentPostSummary;
  threadGroups: CommentThreadGroup[];
  allComments: Comment[];
  brandUsername?: string | null;
  threadSort: ThreadSortMode;
  onThreadSortChange: (mode: ThreadSortMode) => void;
  insights: PostInsightsResult | null;
  loadingComments: boolean;
  loadingInsights: boolean;
  syncing: boolean;
  reconciling: boolean;
  syncWarning: string | null;
  metaConnected: boolean;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  onSync: () => void;
  onReconcile: () => void;
  onRefreshInsights: () => void;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (commentId: string) => void;
};

const STAT_CONFIG: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: "reach", label: "Alcance", icon: Users, accent: "bg-primary/10 text-primary" },
  { key: "views", label: "Visualizações", icon: Eye, accent: "bg-primary/10 text-primary" },
  { key: "likes", label: "Curtidas", icon: Heart, accent: "bg-destructive/10 text-destructive" },
  { key: "saved", label: "Salvos", icon: Bookmark, accent: "bg-muted text-muted-foreground" },
  {
    key: "comments",
    label: "Comentários",
    icon: MessageCircle,
    accent: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
];

function formatPublishedCompact(value: string | null): string {
  if (!value) {
    return "sem data";
  }
  const parsed = new Date(value);
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear()).slice(-2);
  const time = parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}/${month}/${year} ${time}`;
}

function postTitle(caption: string | null): string {
  const text = caption?.trim();
  if (!text) {
    return "Publicação sem legenda";
  }
  return text.replace(/\s+/g, " ");
}

function InsightStat({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
  accent: string;
  loading: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md bg-muted/45 px-2 py-1.5 outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:px-2.5"
            tabIndex={0}
          />
        }
      >
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8",
            accent,
          )}
        >
          <Icon className="size-3.5 sm:size-4" />
        </div>
        {loading ? (
          <Skeleton className="h-6 w-10 shrink-0" />
        ) : (
          <p className="min-w-0 truncate font-display text-base font-semibold leading-none tabular-nums sm:text-lg">
            {value === null ? "—" : formatInsightValue(value)}
          </p>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PostDetailPanel({
  post,
  threadGroups,
  allComments,
  brandUsername,
  threadSort,
  onThreadSortChange,
  insights,
  loadingComments,
  loadingInsights,
  syncing,
  reconciling,
  syncWarning,
  metaConnected,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  onSync,
  onReconcile,
  onRefreshInsights,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
}: PostDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "caption">("comments");
  const slides = resolveMediaSlides(post.post_id, insights?.media);
  const permalink = insights?.media?.permalink ?? null;
  const metricRows = insights?.insights ?? [];
  const insightsError = insights && !insights.ok ? insights.message : null;
  const hasInsightsData = metricRows.length > 0;
  const publishedLabel = formatPublishedCompact(post.published_at);
  const captionPreview = post.caption?.trim();
  const title = postTitle(post.caption);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden lg:flex-row">
      <div
        className="flex min-h-0 w-full shrink-0 flex-col overflow-y-auto lg:w-[42%] lg:border-r lg:border-border"
      >
        <div className="shrink-0">
          <PostMediaCarousel
            slides={slides}
            loading={loadingInsights && slides.length === 0}
            caption={post.caption}
            layout="hero"
          />
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="space-y-3 border-b border-border/60 pb-4">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] leading-none">
              {post.is_external ? (
                <Badge
                  variant="outline"
                  className="h-5 shrink-0 px-1.5 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                >
                  Externa
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="h-5 shrink-0 px-1.5 text-[10px] border-primary/25 bg-primary/10 text-primary"
                >
                  Iris
                </Badge>
              )}
              {post.pending_count > 0 ? (
                <Badge
                  className="h-5 shrink-0 px-1.5 text-[10px] bg-amber-500 text-white hover:bg-amber-500/90"
                  title="Comentários aguardando resposta ou aprovação da Iris"
                >
                  {post.pending_count} pendente{post.pending_count === 1 ? "" : "s"}
                </Badge>
              ) : null}
              <span
                className="inline-flex min-w-0 flex-1 items-center gap-1 truncate font-mono text-muted-foreground"
                title={post.ig_media_id}
              >
                <Hash className="size-3 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{post.ig_media_id || post.post_id}</span>
              </span>
              <span className="shrink-0 tabular-nums whitespace-nowrap text-muted-foreground">
                {publishedLabel}
              </span>
            </div>

            <h2
              className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl"
              title={title}
            >
              {title}
            </h2>
          </div>

          <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Desempenho
                </h3>
                <div className="flex items-center gap-2">
                  {insights?.fetched_at ? (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(insights.fetched_at).toLocaleTimeString("pt-BR")}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 shrink-0"
                    onClick={onRefreshInsights}
                    disabled={!metaConnected || loadingInsights}
                    aria-label="Atualizar insights"
                  >
                    {loadingInsights ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <BarChart3 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {insightsError ? (
                <div
                  className={cn(
                    "mb-3 rounded-lg border px-3 py-2 text-sm",
                    hasInsightsData
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-950"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  <p className="font-medium">
                    {hasInsightsData
                      ? "Algumas métricas não estão disponíveis"
                      : "Não foi possível carregar insights"}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90">{insightsError}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {STAT_CONFIG.map((stat) => (
                  <div key={stat.key} className="min-w-0 w-full">
                    <InsightStat
                      label={stat.label}
                      icon={stat.icon}
                      accent={stat.accent}
                      value={insightMetricValue(metricRows, stat.key)}
                      loading={loadingInsights}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-muted/20 p-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {permalink ? (
              <a
                href={permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-muted"
              >
                <ExternalLink className="size-4 shrink-0" />
                Ver no IG
              </a>
            ) : (
              <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled>
                <InstagramIcon className="size-4 opacity-50" />
                Ver no IG
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={onReconcile}
              disabled={!metaConnected || reconciling || syncing || loadingComments}
            >
              {reconciling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              Vincular respostas
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5"
              onClick={onSync}
              disabled={!metaConnected || syncing || loadingComments}
            >
              {syncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Sincronizar
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("comments")}
                className={cn(
                  "inline-flex items-center gap-1.5 pb-0.5 text-sm font-semibold transition-colors",
                  activeTab === "comments"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Comentários
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                    activeTab === "comments"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {post.comments_count}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("caption")}
                className={cn(
                  "pb-0.5 text-sm font-semibold transition-colors",
                  activeTab === "caption"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Legenda
              </button>
            </div>

            {activeTab === "comments" && !loadingComments && threadGroups.length > 0 ? (
              <ThreadSortSelect value={threadSort} onChange={onThreadSortChange} />
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
          {activeTab === "comments" ? (
            <div className="flex flex-col gap-4">
              {syncWarning ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
                  {syncWarning}
                </p>
              ) : null}

              {loadingComments ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-md" />
                  <Skeleton className="h-24 w-full rounded-md" />
                </div>
              ) : threadGroups.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="font-medium">Nenhum comentário ainda</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Novos chegam via webhook. Use sincronizar para buscar histórico na Meta.
                  </p>
                </div>
              ) : (
                <CommentThread
                  groups={threadGroups}
                  allComments={allComments}
                  brandUsername={brandUsername}
                  approvingId={approvingId}
                  removingDraftId={removingDraftId}
                  savingDraftId={savingDraftId}
                  generatingId={generatingId}
                  onApproveDraft={onApproveDraft}
                  onRemoveDraft={onRemoveDraft}
                  onSaveDraft={onSaveDraft}
                  onGenerateDraft={onGenerateDraft}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                {captionPreview || "(sem legenda)"}
              </p>
              <CarouselSummaryEditor
                postId={post.post_id}
                initialSummary={post.carousel_summary}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
