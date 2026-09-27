import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import {
  OpsEmptyState,
  opsFilterSelectClassName,
} from "@/components/templates/ops-empty-state";
import { useAppRoutes } from "@/demo/demo-routes";
import { interpolate } from "@/i18n/compose";
import { formatCountdownTo } from "@/i18n/formatting";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { fetchAgentReplyQueue, subscribeRealtimeEvents } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { messagesHref } from "@/lib/messages-href";
import type { AgentReplyQueueItem, AgentReplyQueueSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRelativeTimeTick } from "@/lib/format-relative-time";

const QUEUE_REALTIME_DEBOUNCE_MS = 400;

function phaseBadgeClass(phase: AgentReplyQueueItem["phase"]): string {
  return phase === "due"
    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
    : "bg-amber-500/15 text-amber-800 dark:text-amber-200";
}

function inboxHref(
  item: AgentReplyQueueItem,
  routes: ReturnType<typeof useAppRoutes>,
): string | null {
  if (item.channel === "dm" && item.conversation_id) {
    return messagesHref({
      basePath: routes.messages,
      conversationId: item.conversation_id,
      messageId: item.message_id,
    });
  }
  if (item.channel === "comment" && item.post_id) {
    const params = new URLSearchParams({ post_id: item.post_id });
    if (item.comment_id) {
      params.set("comment_id", item.comment_id);
    }
    return `${routes.comments}?${params.toString()}`;
  }
  return null;
}

export function AgentQueuePage() {
  const { locale, bcp47 } = useAppLocale();
  const t = useDomainMessages("agent").queue;
  const routes = useAppRoutes();
  const tick = useRelativeTimeTick(1_000);
  const [snapshot, setSnapshot] = useState<AgentReplyQueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAgentReplyQueue();
      setSnapshot(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [locale, t.toasts.loadFailed]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      void load();
    }, QUEUE_REALTIME_DEBOUNCE_MS);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents({
      onConnectionChange: setLiveConnected,
      onMessagesChanged: scheduleRefresh,
      onCommentsChanged: scheduleRefresh,
    });
    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh]);

  const items = useMemo(() => {
    const source = snapshot?.items ?? [];
    return source.filter((item) => {
      if (phaseFilter && item.phase !== phaseFilter) {
        return false;
      }
      if (channelFilter && item.channel !== channelFilter) {
        return false;
      }
      return true;
    });
  }, [snapshot?.items, phaseFilter, channelFilter]);

  const now = useMemo(() => Date.now(), [tick]);

  const debounceNote =
    snapshot == null
      ? null
      : interpolate(t.page.debounceNote, {
          messageMinutes: Math.round(snapshot.message_debounce_seconds / 60),
          commentMinutes: Math.round(snapshot.comment_debounce_seconds / 60),
          tickSeconds: snapshot.worker_tick_interval_seconds,
        });

  const listFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={opsFilterSelectClassName}
        value={phaseFilter}
        onChange={(event) => setPhaseFilter(event.target.value)}
      >
        <option value="">{t.filters.allPhases}</option>
        <option value="debouncing">{t.filters.debouncing}</option>
        <option value="due">{t.filters.due}</option>
      </select>
      <select
        className={opsFilterSelectClassName}
        value={channelFilter}
        onChange={(event) => setChannelFilter(event.target.value)}
      >
        <option value="">{t.filters.allChannels}</option>
        <option value="dm">{t.filters.dm}</option>
        <option value="comment">{t.filters.comment}</option>
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void load()}
        disabled={loading}
      >
        <RefreshCw
          className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
        />
        {t.page.refresh}
      </Button>
      <span
        className={cn(
          "rounded-sm px-2 py-0.5 text-xs font-semibold uppercase",
          liveConnected
            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
            : "bg-muted text-muted-foreground",
        )}
      >
        {liveConnected ? t.page.live : t.page.offline}
      </span>
      {snapshot ? (
        <span className="text-xs text-muted-foreground">
          {snapshot.counts.debouncing} {t.filters.debouncing} · {snapshot.counts.due}{" "}
          {t.filters.due}
        </span>
      ) : null}
    </div>
  );

  const listBody =
    loading && items.length === 0 ? (
      <OpsEmptyState>{t.page.loading}</OpsEmptyState>
    ) : items.length === 0 ? (
      <OpsEmptyState title={t.empty.title}>{t.empty.body}</OpsEmptyState>
    ) : (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sm:px-6">{t.table.phase}</TableHead>
            <TableHead>{t.table.channel}</TableHead>
            <TableHead>{t.table.author}</TableHead>
            <TableHead className="hidden md:table-cell">{t.table.preview}</TableHead>
            <TableHead className="hidden lg:table-cell">{t.table.context}</TableHead>
            <TableHead>{t.table.processAt}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.table.occurredAt}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const href = inboxHref(item, routes);
            const processLabel = formatCountdownTo(
              item.agent_reply_not_before,
              locale,
              now,
            );

            return (
              <TableRow key={item.id}>
                <TableCell className="sm:px-6">
                  <span
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-xs font-semibold uppercase",
                      phaseBadgeClass(item.phase),
                    )}
                  >
                    {t.phase[item.phase]}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {t.channel[item.channel]}
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-foreground">{item.author_label}</p>
                  {item.ai_locked ? (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                      {t.aiLocked}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                  {item.text_preview}
                </TableCell>
                <TableCell className="hidden max-w-48 truncate text-muted-foreground lg:table-cell">
                  {item.context_label}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-foreground">
                  {processLabel ?? "—"}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                  {new Date(item.occurred_at).toLocaleString(bcp47)}
                </TableCell>
                <TableCell className="text-right">
                  {href ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      render={<Link to={href} aria-label={t.page.openInbox} />}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <div className="shrink-0 space-y-3 px-4 py-4 sm:px-6 md:px-8">
              <PageContainer.Header
                title={t.page.title}
                description={t.page.description}
              />
              {debounceNote ? (
                <p className="text-xs text-muted-foreground">{debounceNote}</p>
              ) : null}
              {listFilters}
            </div>
            <PageScrollArea>{listBody}</PageScrollArea>
          </div>
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
