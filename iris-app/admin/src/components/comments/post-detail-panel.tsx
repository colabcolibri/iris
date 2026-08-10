import {
  BarChart3,
  Bookmark,
  Calendar,
  Eye,
  ExternalLink,
  Hash,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { PostMediaCarousel } from "@/components/comments/post-media-carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveMediaSlides } from "@/hooks/use-post-preview";
import { formatInsightValue, insightMetricValue } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { Comment, CommentPostSummary, PostInsightsResult } from "@/lib/types";
import { CommentThread } from "./comment-thread";

type DisplayComment = Comment & { depth: number };

type PostDetailPanelProps = {
  post: CommentPostSummary;
  comments: DisplayComment[];
  insights: PostInsightsResult | null;
  loadingComments: boolean;
  loadingInsights: boolean;
  syncing: boolean;
  syncWarning: string | null;
  metaConnected: boolean;
  approvingId: string | null;
  onSync: () => void;
  onRefreshInsights: () => void;
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
};

const STAT_CONFIG: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "reach", label: "Alcance", icon: Users },
  { key: "views", label: "Visualizações", icon: Eye },
  { key: "likes", label: "Curtidas", icon: Heart },
  { key: "comments", label: "Comentários", icon: MessageCircle },
  { key: "saved", label: "Salvos", icon: Bookmark },
];

function formatPublishedAt(value: string | null): string {
  if (!value) {
    return "Data não informada";
  }
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function postTitle(caption: string | null): string {
  const text = caption?.trim();
  if (!text) {
    return "Publicação sem legenda";
  }
  const firstLine = text.split("\n")[0]?.trim() ?? text;
  if (firstLine.length <= 50) {
    return firstLine;
  }
  return `${firstLine.slice(0, 50)}…`;
}

function ActionButton({
  label,
  loading,
  icon: Icon,
  onClick,
  disabled,
  variant = "outline",
  className,
}: {
  label: string;
  loading: boolean;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: "outline" | "default";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn("w-full", className)}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mr-2 inline-flex size-4 shrink-0 items-center justify-center">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </span>
      {label}
    </Button>
  );
}

function InsightStat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="font-display text-3xl font-semibold leading-none tabular-nums">
            {value === null ? "—" : formatInsightValue(value)}
          </p>
        )}
      </div>
      <p className="mt-2.5 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function PostDetailPanel({
  post,
  comments,
  insights,
  loadingComments,
  loadingInsights,
  syncing,
  syncWarning,
  metaConnected,
  approvingId,
  onSync,
  onRefreshInsights,
  onApproveDraft,
}: PostDetailPanelProps) {
  const slides = resolveMediaSlides(post.post_id, insights?.media);
  const permalink = insights?.media?.permalink ?? null;
  const metricRows = insights?.insights ?? [];
  const insightsError = insights && !insights.ok ? insights.message : null;
  const hasInsightsData = metricRows.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="w-full shrink-0 border-b bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex w-full flex-col gap-3">
          <div className="grid w-full grid-cols-3 gap-2">
            {permalink ? (
              <a
                href={permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                <InstagramIcon className="size-4 shrink-0" />
                Ver no IG
                <ExternalLink className="size-3.5 shrink-0 opacity-60" />
              </a>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled
              >
                <InstagramIcon className="mr-2 size-4 shrink-0 opacity-50" />
                Ver no IG
              </Button>
            )}
            <ActionButton
              label="Insights"
              loading={loadingInsights}
              icon={BarChart3}
              onClick={onRefreshInsights}
              disabled={!metaConnected || loadingInsights}
            />
            <ActionButton
              label="Sincronizar"
              loading={syncing}
              icon={RefreshCw}
              onClick={onSync}
              disabled={!metaConnected || syncing || loadingComments}
              variant="default"
            />
          </div>

          <h2 className="w-full font-display text-lg font-semibold leading-snug sm:text-xl">
            {postTitle(post.caption)}
          </h2>

          <div className="flex w-full flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {post.is_external ? (
              <Badge
                variant="outline"
                className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100"
              >
                Externa
              </Badge>
            ) : (
              <Badge variant="secondary">Iris</Badge>
            )}
            {post.pending_count > 0 ? (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">
                {post.pending_count} pendente{post.pending_count === 1 ? "" : "s"}
              </Badge>
            ) : null}
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span className="truncate">{formatPublishedAt(post.published_at)}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-xs">
              <Hash className="size-3.5 shrink-0" />
              <span className="truncate">{post.ig_media_id}</span>
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start">
            <PostMediaCarousel
              slides={slides}
              loading={loadingInsights && slides.length === 0}
              caption={post.caption}
              className="w-full max-w-[280px] md:max-w-none"
            />

            <div className="min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Desempenho</h3>
                {insights?.fetched_at ? (
                  <span className="text-xs text-muted-foreground">
                    {new Date(insights.fetched_at).toLocaleTimeString("pt-BR")}
                  </span>
                ) : null}
              </div>

              {insightsError ? (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    hasInsightsData
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-50"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  <p className="font-medium">
                    {hasInsightsData
                      ? "Algumas métricas não estão disponíveis"
                      : "Não foi possível carregar insights"}
                  </p>
                  <p className="mt-1 text-xs opacity-90">{insightsError}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                {STAT_CONFIG.map((stat) => (
                  <InsightStat
                    key={stat.key}
                    label={stat.label}
                    icon={stat.icon}
                    value={insightMetricValue(metricRows, stat.key)}
                    loading={loadingInsights}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="w-full rounded-xl border bg-muted/15 p-4">
            <h3 className="mb-2 text-sm font-semibold">Legenda</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {post.caption?.trim() || "(sem legenda)"}
            </p>
          </div>

          <Separator />

          <section className="w-full space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="size-4 text-muted-foreground" />
                Comentários
                <span className="font-normal text-muted-foreground">
                  {post.comments_count} salvo{post.comments_count === 1 ? "" : "s"}
                </span>
              </h3>
            </div>

            {syncWarning ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-50">
                {syncWarning}
              </p>
            ) : null}

            {loadingComments ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-xl border bg-muted/20 px-6 py-12 text-center">
                <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Nenhum comentário ainda</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Novos chegam via webhook. Use sincronizar para buscar histórico na Meta.
                </p>
              </div>
            ) : (
              <CommentThread
                comments={comments}
                approvingId={approvingId}
                onApproveDraft={onApproveDraft}
              />
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
