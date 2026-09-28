import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  PanelLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AppSheet } from "@/components/templates/app-sheet";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import {
  OpsEmptyState,
  opsFilterSelectClassName,
} from "@/components/templates/ops-empty-state";
import { downloadWebhookEventsExport, fetchWebhookEvents } from "@/lib/api";
import type { WebhookEvent, WebhookProcessingStatus } from "@/lib/types";
import { commentsThreadHref } from "@/lib/comments-href";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const STATUS_FILTER_OPTIONS: Array<WebhookProcessingStatus | "all"> = [
  "all",
  "received",
  "processed",
  "ignored",
  "failed",
];

function statusClass(status: WebhookEvent["processing_status"]): string {
  switch (status) {
    case "processed":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "ignored":
      return "bg-muted text-muted-foreground";
    case "failed":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  }
}

function truncateId(id: string | null): string {
  if (!id) {
    return "—";
  }
  return `${id.slice(0, 8)}…`;
}

function verbLabel(
  verb: string | null,
  labels: ReturnType<typeof useDomainMessages<"webhooks">>["verb"],
): string | null {
  if (!verb) {
    return null;
  }
  switch (verb.toLowerCase()) {
    case "add":
      return labels.add;
    case "edited":
    case "edit":
      return labels.edited;
    case "remove":
    case "delete":
      return labels.removed;
    default:
      return verb;
  }
}

function StatusBadges({
  event,
  webhooks,
}: {
  event: WebhookEvent;
  webhooks: ReturnType<typeof useDomainMessages<"webhooks">>;
}) {
  const verb = verbLabel(event.verb, webhooks.verb);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "rounded-sm px-2 py-0.5 text-xs font-semibold uppercase",
          statusClass(event.processing_status),
        )}
      >
        {webhooks.status[event.processing_status]}
      </span>
      {verb ? (
        <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {verb}
        </span>
      ) : null}
      {!event.signature_valid ? (
        <span className="rounded-sm bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
          {webhooks.status.invalidSignature}
        </span>
      ) : null}
    </div>
  );
}

function PostLink({
  event,
  webhooks,
}: {
  event: WebhookEvent;
  webhooks: ReturnType<typeof useDomainMessages<"webhooks">>;
}) {
  const href = commentsThreadHref(event.post_id);
  if (href) {
    return (
      <Link to={href} className="text-primary hover:underline">
        {truncateId(event.post_id!)}
      </Link>
    );
  }
  if (event.ig_media_id) {
    return (
      <span className="font-mono text-sm text-muted-foreground">
        {webhooks.table.mediaPrefix} {truncateId(event.ig_media_id)}
      </span>
    );
  }
  return <span className="text-muted-foreground">{webhooks.table.empty}</span>;
}

function CommentLink({
  event,
  webhooks,
}: {
  event: WebhookEvent;
  webhooks: ReturnType<typeof useDomainMessages<"webhooks">>;
}) {
  const href = commentsThreadHref(event.post_id, event.comment_id);
  if (href && event.comment_id) {
    return (
      <Link to={href} className="text-primary hover:underline">
        {truncateId(event.comment_id)}
      </Link>
    );
  }
  if (event.ig_comment_id) {
    return (
      <span className="font-mono text-sm text-muted-foreground">
        {webhooks.table.igPrefix} {truncateId(event.ig_comment_id)}
      </span>
    );
  }
  return <span className="text-muted-foreground">{webhooks.table.empty}</span>;
}

const EXPORT_LIMIT_OPTIONS = [100, 500, 1000, 5000] as const;

function EventTable({
  events,
  selectedId,
  onSelect,
  webhooks,
  locale,
  compact = false,
}: {
  events: WebhookEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
  webhooks: ReturnType<typeof useDomainMessages<"webhooks">>;
  locale: string;
  compact?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(compact ? "px-3" : "sm:px-6")}>
            {webhooks.table.received}
          </TableHead>
          <TableHead>{webhooks.table.type}</TableHead>
          <TableHead>{webhooks.table.status}</TableHead>
          {!compact ? (
            <TableHead className="hidden md:table-cell">{webhooks.table.authorSummary}</TableHead>
          ) : null}
          {!compact ? (
            <TableHead className="hidden lg:table-cell">{webhooks.table.post}</TableHead>
          ) : null}
          {!compact ? (
            <TableHead className="hidden lg:table-cell">{webhooks.table.comment}</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow
            key={event.id}
            data-state={event.id === selectedId ? "selected" : undefined}
            className="cursor-pointer"
            onClick={() => onSelect(event.id)}
          >
            <TableCell
              className={cn(
                "whitespace-nowrap text-muted-foreground",
                compact ? "px-3" : "sm:px-6",
              )}
            >
              {new Date(event.received_at).toLocaleString(locale)}
            </TableCell>
            <TableCell>
              <p className="font-semibold text-foreground">
                {event.webhook_type}
              </p>
              {event.field ? (
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {event.field}
                </p>
              ) : null}
            </TableCell>
            <TableCell>
              <StatusBadges event={event} webhooks={webhooks} />
            </TableCell>
            {!compact ? (
              <TableCell className="hidden md:table-cell">
                <p className="font-medium text-foreground">
                  {event.author_username ? `@${event.author_username}` : webhooks.table.empty}
                </p>
                {event.text_preview ? (
                  <p className="mt-1 line-clamp-2 max-w-md text-muted-foreground">
                    “{event.text_preview}”
                  </p>
                ) : null}
              </TableCell>
            ) : null}
            {!compact ? (
              <TableCell className="hidden lg:table-cell">
                <PostLink event={event} webhooks={webhooks} />
              </TableCell>
            ) : null}
            {!compact ? (
              <TableCell className="hidden lg:table-cell">
                <CommentLink event={event} webhooks={webhooks} />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EventListChrome({
  statusFilter,
  setStatusFilter,
  fieldFilter,
  setFieldFilter,
  invalidOnly,
  setInvalidOnly,
  exportLimit,
  setExportLimit,
  exporting,
  loading,
  onExport,
  onReload,
  webhooks,
}: {
  statusFilter: WebhookProcessingStatus | "all";
  setStatusFilter: (v: WebhookProcessingStatus | "all") => void;
  fieldFilter: "all" | "comments";
  setFieldFilter: (v: "all" | "comments") => void;
  invalidOnly: boolean;
  setInvalidOnly: (v: boolean) => void;
  exportLimit: number;
  setExportLimit: (v: number) => void;
  exporting: boolean;
  loading: boolean;
  onExport: () => void;
  onReload: () => void;
  webhooks: ReturnType<typeof useDomainMessages<"webhooks">>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className="text-sm text-muted-foreground"
          htmlFor="webhook-status-filter"
        >
          {webhooks.filters.statusLabel}
        </label>
        <select
          id="webhook-status-filter"
          className={opsFilterSelectClassName}
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as WebhookProcessingStatus | "all",
            )
          }
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? webhooks.filters.all : webhooks.status[option]}
            </option>
          ))}
        </select>
        <label
          className="text-sm text-muted-foreground"
          htmlFor="webhook-field-filter"
        >
          {webhooks.filters.typeLabel}
        </label>
        <select
          id="webhook-field-filter"
          className={opsFilterSelectClassName}
          value={fieldFilter}
          onChange={(event) =>
            setFieldFilter(event.target.value as "all" | "comments")
          }
        >
          <option value="all">{webhooks.filters.all}</option>
          <option value="comments">{webhooks.filters.commentsOnly}</option>
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={invalidOnly}
            onChange={(event) => setInvalidOnly(event.target.checked)}
          />
          {webhooks.filters.invalidSignatureOnly}
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          htmlFor="webhook-export-limit"
        >
          {webhooks.filters.exportLast}
        </label>
        <select
          id="webhook-export-limit"
          className={opsFilterSelectClassName}
          value={exportLimit}
          onChange={(event) => setExportLimit(Number(event.target.value))}
          disabled={exporting}
        >
          {EXPORT_LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={exporting}
        >
          <Download
            className={`mr-1.5 h-3.5 w-3.5 ${exporting ? "animate-pulse" : ""}`}
          />
          {webhooks.filters.exportJson}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReload}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {webhooks.filters.refresh}
        </Button>
      </div>
    </div>
  );
}

export function WebhookEventsPanel() {
  const { locale, bcp47 } = useAppLocale();
  const webhooks = useDomainMessages("webhooks");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("event_id")?.trim() ?? "";
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportLimit, setExportLimit] = useState<number>(500);
  const [statusFilter, setStatusFilter] = useState<
    WebhookProcessingStatus | "all"
  >("all");
  const [fieldFilter, setFieldFilter] = useState<"all" | "comments">("all");
  const [invalidOnly, setInvalidOnly] = useState(false);
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWebhookEvents(100, {
        status: statusFilter === "all" ? undefined : statusFilter,
        field: fieldFilter === "all" ? undefined : fieldFilter,
        signatureValid: invalidOnly ? false : undefined,
      });
      setEvents(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || webhooks.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [fieldFilter, invalidOnly, locale, statusFilter, webhooks.toasts.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );
  const inStage = Boolean(selectedId);

  function selectEvent(id: string) {
    setSearchParams({ event_id: id });
    setListSheetOpen(false);
  }

  function clearStage() {
    setSearchParams({});
    setListSheetOpen(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadWebhookEventsExport(exportLimit, {
        status: statusFilter === "all" ? undefined : statusFilter,
        field: fieldFilter === "all" ? undefined : fieldFilter,
        signatureValid: invalidOnly ? false : undefined,
      });
      toast.success(interpolate(webhooks.toasts.exported, { count: exportLimit }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || webhooks.toasts.exportFailed);
    } finally {
      setExporting(false);
    }
  }

  const listChrome = (
    <EventListChrome
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      fieldFilter={fieldFilter}
      setFieldFilter={setFieldFilter}
      invalidOnly={invalidOnly}
      setInvalidOnly={setInvalidOnly}
      exportLimit={exportLimit}
      setExportLimit={setExportLimit}
      exporting={exporting}
      loading={loading}
      onExport={() => void handleExport()}
      onReload={() => void load()}
      webhooks={webhooks}
    />
  );

  const listBody = loading && events.length === 0 ? (
    <OpsEmptyState>{webhooks.page.loading}</OpsEmptyState>
  ) : events.length === 0 ? (
    <OpsEmptyState title={webhooks.empty.title}>{webhooks.empty.body}</OpsEmptyState>
  ) : (
    <EventTable
      events={events}
      selectedId={selectedId}
      onSelect={selectEvent}
      webhooks={webhooks}
      locale={bcp47}
    />
  );

  const sheetListBody =
    loading && events.length === 0 ? (
      <OpsEmptyState className="mx-3 my-4">{webhooks.page.loadingShort}</OpsEmptyState>
    ) : events.length === 0 ? (
      <OpsEmptyState className="mx-3 my-4" title={webhooks.empty.title}>
        {webhooks.empty.sheetBody}
      </OpsEmptyState>
    ) : (
      <EventTable
        events={events}
        selectedId={selectedId}
        onSelect={selectEvent}
        webhooks={webhooks}
        locale={bcp47}
        compact
      />
    );

  if (!inStage) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-4 pb-4 sm:px-6 md:px-8">{listChrome}</div>
        <PageScrollArea>{listBody}</PageScrollArea>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 gap-2"
          onClick={clearStage}
        >
          <ArrowLeft className="size-4" />
          {webhooks.page.backToAll}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 gap-2"
          onClick={() => setListSheetOpen(true)}
        >
          <PanelLeft className="size-4" />
          {webhooks.page.list}
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {selectedEvent
            ? `${selectedEvent.webhook_type}${selectedEvent.author_username ? ` · @${selectedEvent.author_username}` : ""}`
            : selectedId}
        </p>
      </div>

      <PageScrollArea contentClassName="p-4 sm:p-6 md:px-8">
        {!selectedEvent ? (
          <OpsEmptyState>
            {loading ? webhooks.page.loadingEvent : webhooks.page.eventNotFound}
          </OpsEmptyState>
        ) : (
          <div className="w-full space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadges event={selectedEvent} webhooks={webhooks} />
              <span className="text-sm text-muted-foreground">
                {new Date(selectedEvent.received_at).toLocaleString(bcp47)}
              </span>
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground">
                {selectedEvent.webhook_type}
              </h2>
              {selectedEvent.field ? (
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {selectedEvent.field}
                </p>
              ) : null}
            </div>

            {selectedEvent.text_preview ? (
              <p className="text-base leading-relaxed text-foreground">
                “{selectedEvent.text_preview}”
              </p>
            ) : null}
            {selectedEvent.error_message ? (
              <p className="text-base text-destructive">
                {selectedEvent.error_message}
              </p>
            ) : null}

            <div className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-none sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {webhooks.detail.post}
                </p>
                <div className="mt-1 text-base">
                  <PostLink event={selectedEvent} webhooks={webhooks} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {webhooks.detail.comment}
                </p>
                <div className="mt-1 text-base">
                  <CommentLink event={selectedEvent} webhooks={webhooks} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {webhooks.detail.author}
                </p>
                <p className="mt-1 text-base text-foreground">
                  {selectedEvent.author_username
                    ? `@${selectedEvent.author_username}`
                    : webhooks.table.empty}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {webhooks.detail.entries}
                </p>
                <p className="mt-1 text-base text-foreground">
                  {selectedEvent.entries_count}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {webhooks.detail.payload}
              </h3>
              <PageScrollArea
                className="mt-2 h-[min(70vh,40rem)] max-h-[min(70vh,40rem)] flex-none rounded-lg border border-border bg-card shadow-none"
                contentClassName="p-4 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground"
              >
                {selectedEvent.payload_json}
                {selectedEvent.payload_truncated ? webhooks.detail.payloadTruncated : ""}
              </PageScrollArea>
            </div>
          </div>
        )}
      </PageScrollArea>

      <AppSheet open={listSheetOpen} onOpenChange={setListSheetOpen} side="left" size="md">
        <AppSheet.Header title={webhooks.page.sheetTitle} />
        <div className="shrink-0 space-y-3 border-b border-border p-4">
          {listChrome}
        </div>
        <AppSheet.Body scroll={false}>
          <PageScrollArea className="min-h-0 flex-1">{sheetListBody}</PageScrollArea>
        </AppSheet.Body>
      </AppSheet>
    </div>
  );
}
