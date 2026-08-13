import { useState, useEffect } from "react";
import {
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
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveMediaSlides } from "@/hooks/use-post-preview";
import {
  formatRelativeTimeAgo,
  useRelativeTimeTick,
} from "@/lib/format-relative-time";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { formatInsightValue, insightMetricValue } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type {
  CommentThreadGroup,
  ThreadSortMode,
} from "@/lib/build-comment-tree";
import type {
  Comment,
  CommentPostSummary,
  PostInsightsResult,
} from "@/lib/types";
import { ThreadSortSelect } from "@/components/comments/thread-sort-select";
import { PostReplyStatusBadge } from "@/components/posts/post-reply-status-badge";
import { PostReplyBriefingEditor } from "@/components/posts/post-reply-briefing-editor";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/contexts/app-settings-context";
import {
  resolveEffectivePostReplyStatus,
  replyStatusPresentation,
} from "@iris/domain/reply-effective-status";
import { igMediaStatusPresentation } from "@iris/domain/meta/ig-media-status";
import type { IgMediaStatus } from "@iris/domain/meta/ig-media-status";
import type { PostReplyModeSetting } from "@/lib/types";

type PostDetailPanelProps = {
  post: CommentPostSummary;
  threadGroups: CommentThreadGroup[];
  allComments: Comment[];
  brandUsername?: string | null;
  focusCommentId?: string | null;
  threadSort: ThreadSortMode;
  onThreadSortChange: (mode: ThreadSortMode) => void;
  insights: PostInsightsResult | null;
  lastSyncedAt?: number | null;
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
  onApproveDraft: (commentId: string, draftText?: string | null) => void;
  onRemoveDraft: (commentId: string) => void;
  onSaveDraft: (commentId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (commentId: string) => void;
  replyMode: PostReplyModeSetting;
  savingReplyMode?: boolean;
  onReplyModeChange: (mode: PostReplyModeSetting) => void;
};

const STAT_CONFIG: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    key: "reach",
    label: "Alcance",
    icon: Users,
    accent: "bg-primary/10 text-primary",
  },
  {
    key: "views",
    label: "Visualizações",
    icon: Eye,
    accent: "bg-primary/10 text-primary",
  },
  {
    key: "likes",
    label: "Curtidas",
    icon: Heart,
    accent: "bg-destructive/10 text-destructive",
  },
  {
    key: "saved",
    label: "Salvos",
    icon: Bookmark,
    accent: "bg-muted text-muted-foreground",
  },
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

function InsightMetricCard({
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
    <div className="flex min-w-0 flex-col gap-3 rounded-(--iris-radius-lg) border border-border/70 bg-card p-4">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            accent,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <p className="min-w-0 text-sm font-semibold leading-snug text-muted-foreground">
          {label}
        </p>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="font-display text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
          {value === null ? "—" : formatInsightValue(value)}
        </p>
      )}
    </div>
  );
}

function LastSyncedLabel({
  syncedAt,
}: {
  syncedAt: number | null | undefined;
}) {
  const { locale, bcp47 } = useAppLocale();
  const detail = useDomainMessages("comments").detail;
  useRelativeTimeTick();
  if (!syncedAt) {
    return null;
  }

  const relative = formatRelativeTimeAgo(syncedAt, locale);
  if (!relative) {
    return null;
  }

  return (
    <p
      className="text-xs leading-snug text-muted-foreground"
      title={new Date(syncedAt).toLocaleString(bcp47)}
    >
      {detail.lastSyncPrefix} {relative}
    </p>
  );
}

type DetailTab =
  | "performance"
  | "comments"
  | "caption"
  | "summary"
  | "briefing"
  | "config";

function PerformanceTabContent({
  insightsError,
  hasInsightsData,
  metricRows,
  loadingInsights,
  igMediaStatus,
  igMediaStatusDetail,
}: {
  insightsError: string | null;
  hasInsightsData: boolean;
  metricRows: NonNullable<PostInsightsResult["insights"]>;
  loadingInsights: boolean;
  igMediaStatus: IgMediaStatus | null;
  igMediaStatusDetail: string | null;
}) {
  const igMediaCopy =
    igMediaStatus && igMediaStatus !== "on_feed"
      ? igMediaStatusPresentation(igMediaStatus)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {igMediaCopy ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            igMediaStatus === "archived"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-100"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          <p className="font-semibold">{igMediaCopy.label}</p>
          <p className="mt-0.5 text-xs opacity-90">
            {igMediaStatusDetail ?? igMediaCopy.hint}
          </p>
        </div>
      ) : null}

      {insightsError ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            hasInsightsData
              ? "border-amber-500/30 bg-amber-500/10 text-amber-950"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          <p className="font-semibold">
            {hasInsightsData
              ? "Algumas métricas não estão disponíveis"
              : "Não foi possível carregar insights"}
          </p>
          <p className="mt-0.5 text-xs opacity-90">{insightsError}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STAT_CONFIG.map((stat) => (
          <InsightMetricCard
            key={stat.key}
            label={stat.label}
            icon={stat.icon}
            accent={stat.accent}
            value={insightMetricValue(metricRows, stat.key)}
            loading={loadingInsights && !hasInsightsData}
          />
        ))}
      </div>
    </div>
  );
}

function PostMetaToolbar({
  permalink,
  metaConnected,
  syncing,
  reconciling,
  onSync,
  lastSyncedAt,
}: {
  permalink: string | null;
  metaConnected: boolean;
  syncing: boolean;
  reconciling: boolean;
  onSync: () => void;
  lastSyncedAt?: number | null;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/60 p-4 pb-3 sm:px-5">
      <div className="grid grid-cols-2 gap-2">
        {permalink ? (
          <a
            href={permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-sm font-semibold hover:bg-muted"
          >
            <ExternalLink className="size-4 shrink-0" />
            <span className="truncate">Ver no IG</span>
          </a>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-2"
            disabled
          >
            <InstagramIcon className="size-4 shrink-0 opacity-50" />
            <span className="truncate">Ver no IG</span>
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 px-2"
          onClick={onSync}
          disabled={!metaConnected || syncing || reconciling}
          title="Sincroniza comentários, mídia e métricas com o Instagram"
        >
          {syncing ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <RefreshCw className="size-4 shrink-0" />
          )}
          <span className="truncate">Sincronizar</span>
        </Button>
      </div>
      <LastSyncedLabel syncedAt={lastSyncedAt} />
    </div>
  );
}

export function PostDetailPanel({
  post,
  threadGroups,
  allComments,
  brandUsername,
  focusCommentId = null,
  threadSort,
  onThreadSortChange,
  insights,
  lastSyncedAt,
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
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  replyMode,
  savingReplyMode = false,
  onReplyModeChange,
}: PostDetailPanelProps) {
  const { replyMode: globalReplyMode } = useAppSettings();
  const effectiveReply = resolveEffectivePostReplyStatus(
    globalReplyMode,
    replyMode,
  );
  const effectiveReplyCopy = replyStatusPresentation(effectiveReply);
  const [activeTab, setActiveTab] = useState<DetailTab>("performance");
  const slides = resolveMediaSlides(post.post_id, insights?.media);

  useEffect(() => {
    if (focusCommentId) {
      setActiveTab("comments");
    }
  }, [focusCommentId, post.post_id]);
  const permalink = insights?.media?.permalink ?? null;
  const metricRows = insights?.insights ?? [];
  const igMediaStatus =
    insights?.ig_media_status ?? post.ig_media_status ?? null;
  const igMediaStatusDetail =
    insights?.ig_media_status_detail ?? post.ig_media_status_detail ?? null;
  const insightsError = insights && !insights.ok ? insights.message : null;
  const hasInsightsData = metricRows.length > 0;
  const publishedLabel = formatPublishedCompact(post.published_at);
  const captionPreview = post.caption?.trim();
  const title = postTitle(post.caption);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex max-h-[min(48vh,22rem)] min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-border lg:max-h-none lg:w-[42%] lg:border-b-0 lg:border-r">
        <PageScrollArea>
          <PostMetaToolbar
            permalink={permalink}
            metaConnected={metaConnected}
            syncing={syncing}
            reconciling={reconciling}
            onSync={onSync}
            lastSyncedAt={lastSyncedAt}
          />

          <div className="shrink-0">
            <PostMediaCarousel
              slides={slides}
              loading={loadingInsights && slides.length === 0}
              caption={post.caption}
              layout="hero"
            />
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="space-y-3">
              <div className="flex min-w-0 items-center gap-1.5 text-xs leading-none">
                {post.is_external ? (
                  <Badge
                    variant="outline"
                    className="h-5 shrink-0 px-1.5 text-xs border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                  >
                    Externa
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="h-5 shrink-0 px-1.5 text-xs border-primary/25 bg-primary/10 text-primary"
                  >
                    Iris
                  </Badge>
                )}
                {post.pending_count > 0 ? (
                  <Badge
                    className="h-5 shrink-0 px-1.5 text-xs bg-amber-500 text-white hover:bg-amber-500/90"
                    title="Comentários aguardando resposta ou aprovação da Iris"
                  >
                    {post.pending_count} pendente
                    {post.pending_count === 1 ? "" : "s"}
                  </Badge>
                ) : null}
                {igMediaStatus && igMediaStatus !== "on_feed" ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 shrink-0 px-1.5 text-xs",
                      igMediaStatus === "archived"
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100"
                        : "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                    title={igMediaStatusDetail ?? undefined}
                  >
                    {igMediaStatusPresentation(igMediaStatus).label}
                  </Badge>
                ) : null}
                <span
                  className="inline-flex min-w-0 flex-1 items-center gap-1 truncate font-mono text-muted-foreground"
                  title={post.ig_media_id}
                >
                  <Hash className="size-3 shrink-0 opacity-70" aria-hidden />
                  <span className="truncate">
                    {post.ig_media_id || post.post_id}
                  </span>
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
          </div>
        </PageScrollArea>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border bg-muted/20 px-4 pt-3 sm:px-5">
          <div className="-mx-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <div
              role="tablist"
              aria-label="Detalhes da publicação"
              className="flex w-max min-w-full flex-nowrap items-center gap-x-4 border-b border-border/50 px-1 pb-2"
            >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "performance"}
              onClick={() => setActiveTab("performance")}
              className={cn(
                "shrink-0 pb-0.5 text-sm font-semibold transition-colors",
                activeTab === "performance"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Desempenho
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "comments"}
              onClick={() => setActiveTab("comments")}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-sm font-semibold transition-colors",
                activeTab === "comments"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Comentários
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
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
              role="tab"
              aria-selected={activeTab === "caption"}
              onClick={() => setActiveTab("caption")}
              className={cn(
                "shrink-0 pb-0.5 text-sm font-semibold transition-colors",
                activeTab === "caption"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Legenda
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "summary"}
              onClick={() => setActiveTab("summary")}
              className={cn(
                "shrink-0 pb-0.5 text-sm font-semibold transition-colors",
                activeTab === "summary"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Resumo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "briefing"}
              onClick={() => setActiveTab("briefing")}
              className={cn(
                "shrink-0 pb-0.5 text-sm font-semibold transition-colors",
                activeTab === "briefing"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Prompt adicional
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "config"}
              onClick={() => setActiveTab("config")}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-sm font-semibold transition-colors",
                activeTab === "config"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Config
              <PostReplyStatusBadge
                post={{ reply_mode: replyMode }}
                globalReplyMode={globalReplyMode}
                size="sm"
                className="hidden sm:inline-flex"
              />
            </button>
            </div>
          </div>
        </div>

        <PageScrollArea contentClassName="p-4 sm:p-5">
          {activeTab === "performance" ? (
            <PerformanceTabContent
              insightsError={insightsError ?? null}
              hasInsightsData={hasInsightsData}
              metricRows={metricRows}
              loadingInsights={loadingInsights}
              igMediaStatus={igMediaStatus}
              igMediaStatusDetail={igMediaStatusDetail}
            />
          ) : activeTab === "comments" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 sm:flex-1">
                  <ThreadSortSelect
                    value={threadSort}
                    onChange={onThreadSortChange}
                    fullWidth
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-1.5 sm:w-auto"
                  onClick={onReconcile}
                  disabled={
                    !metaConnected || reconciling || syncing || loadingComments
                  }
                  title="Sincroniza com o Instagram, marca removidos e vincula respostas da marca já existentes no thread"
                >
                  {reconciling ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <Link2 className="size-4 shrink-0" />
                  )}
                  Vincular respostas
                </Button>
              </div>

              {syncWarning ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
                  {syncWarning}
                </p>
              ) : null}

              {loadingComments && threadGroups.length === 0 ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-md" />
                  <Skeleton className="h-24 w-full rounded-md" />
                </div>
              ) : threadGroups.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="font-semibold">Nenhum comentário ainda</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Novos chegam via webhook. Use sincronizar para buscar
                    histórico na Meta.
                  </p>
                </div>
              ) : (
                <CommentThread
                  groups={threadGroups}
                  allComments={allComments}
                  brandUsername={brandUsername}
                  focusCommentId={focusCommentId}
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
          ) : activeTab === "caption" ? (
            <div className="min-w-0">
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                {captionPreview || "(sem legenda)"}
              </p>
            </div>
          ) : activeTab === "summary" ? (
            <div className="min-w-0">
              <CarouselSummaryEditor
                postId={post.post_id}
                initialSummary={post.carousel_summary}
              />
            </div>
          ) : activeTab === "briefing" ? (
            <div className="min-w-0">
              <PostReplyBriefingEditor
                postId={post.post_id}
                initialReplyPrompt={post.reply_prompt}
                initialSilenceSoul={post.silence_soul}
                initialSilencePage={post.silence_page}
                initialSilenceKnowledge={post.silence_knowledge}
                initialSilenceRestrictions={post.silence_restrictions}
              />
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Resposta da Iris
                </h3>
                <p className="text-sm text-muted-foreground">
                  {post.is_external
                    ? "Post externo — novos comentários chegam via webhook da Meta."
                    : "Novos comentários chegam via webhook da Meta."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Estado efetivo
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {effectiveReplyCopy.hint ??
                      `Agora: ${effectiveReplyCopy.label.toLowerCase()}.`}
                  </p>
                </div>
                <PostReplyStatusBadge
                  post={{ reply_mode: replyMode }}
                  globalReplyMode={globalReplyMode}
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="comments-post-reply-mode"
                  className="text-sm font-semibold"
                >
                  Modo nesta publicação
                </Label>
                <ReplyModeSelect
                  id="comments-post-reply-mode"
                  variant="post"
                  value={replyMode}
                  onChange={onReplyModeChange}
                  disabled={savingReplyMode}
                />
                <p className="text-xs leading-snug text-muted-foreground">
                  &quot;Seguir global&quot; usa o modo em Configurações →
                  Agente. &quot;Pausar nesta publicação&quot; desliga a Iris só
                  aqui.
                </p>
              </div>
            </div>
          )}
        </PageScrollArea>
      </div>
    </div>
  );
}
