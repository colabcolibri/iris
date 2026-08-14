import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppDialog } from "@/components/templates/app-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { browseMetaMedia, importMonitoredPostsBatch } from "@/lib/api";
import type { BrowseableMediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type ImportPostsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

function captionPreview(
  caption: string | null,
  noCaption: string,
): string {
  const text = caption?.trim();
  if (!text) {
    return noCaption;
  }
  if (text.length <= 60) {
    return text;
  }
  return `${text.slice(0, 60)}…`;
}

function formatDate(
  value: string | null,
  locale: string,
  noDate: string,
): string {
  if (!value) {
    return noDate;
  }
  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCount(value: number | null, locale: string): string {
  if (value === null) {
    return "—";
  }
  return new Intl.NumberFormat(locale).format(value);
}

export function ImportPostsDialog({
  open,
  onOpenChange,
  onImported,
}: ImportPostsDialogProps) {
  const { locale, bcp47 } = useAppLocale();
  const detail = useDomainMessages("comments").detail;
  const importMsg = useDomainMessages("comments").importDialog;
  const [items, setItems] = useState<BrowseableMediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);

  const importableItems = useMemo(
    () => items.filter((item) => !item.already_managed),
    [items],
  );

  const selectedImportableCount = useMemo(
    () =>
      selectedIds.filter((id) =>
        importableItems.some((item) => item.ig_media_id === id),
      ).length,
    [importableItems, selectedIds],
  );

  const loadPage = useCallback(
    async (cursor?: string | null, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const page = await browseMetaMedia({
          limit: PAGE_SIZE,
          after: cursor ?? null,
        });

        setItems((current) =>
          append ? [...current, ...page.items] : page.items,
        );
        setNextCursor(page.next_cursor);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, locale) || importMsg.listFailed,
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [importMsg.listFailed, locale],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds([]);
    void loadPage();
  }, [loadPage, open]);

  const toggleItem = (igMediaId: string, disabled: boolean) => {
    if (disabled) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(igMediaId)
        ? current.filter((id) => id !== igMediaId)
        : [...current, igMediaId],
    );
  };

  const toggleSelectAll = () => {
    const importableIds = importableItems.map((item) => item.ig_media_id);
    const allSelected = importableIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !importableIds.includes(id)),
      );
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...importableIds])]);
  };

  const handleImport = async () => {
    if (selectedImportableCount === 0) {
      toast.error(importMsg.selectOne);
      return;
    }

    setImporting(true);
    try {
      const result = await importMonitoredPostsBatch(selectedIds);
      const importedCount = result.imported.length;
      const skippedCount = result.skipped.length;

      if (importedCount > 0) {
        toast.success(
          importedCount === 1
            ? interpolate(importMsg.importedOne, { count: importedCount })
            : interpolate(importMsg.importedOther, { count: importedCount }),
        );
        onImported();
      }

      if (skippedCount > 0 && importedCount === 0) {
        toast.error(importMsg.noneImported);
      } else if (skippedCount > 0) {
        toast.message(interpolate(importMsg.skipped, { count: skippedCount }));
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, locale) || importMsg.importFailed,
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} size="xl" height="full">
      <AppDialog.Header
        title={importMsg.title}
        description={importMsg.description}
      />

      <AppDialog.Body className="px-0 pb-2">
        <div className="border-b px-6 pb-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={
                importableItems.length > 0 &&
                importableItems.every((item) =>
                  selectedIds.includes(item.ig_media_id),
                )
              }
              disabled={importableItems.length === 0 || loading}
              onChange={toggleSelectAll}
            />
            {interpolate(importMsg.selectAll, {
              count: importableItems.length,
            })}
          </label>
        </div>

        <div className="px-2 py-2">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {importMsg.loadingList}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">
              {importMsg.empty}
            </p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => {
                const disabled = item.already_managed;
                const checked = selectedIds.includes(item.ig_media_id);

                return (
                  <li key={item.ig_media_id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.ig_media_id, disabled)}
                      disabled={disabled}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                        disabled
                          ? "cursor-not-allowed border-border/50 bg-muted/30 opacity-70"
                          : checked
                            ? "border-primary/50 bg-primary/5"
                            : "border-transparent hover:border-border hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-4 shrink-0 rounded border-border"
                        checked={checked}
                        disabled={disabled}
                        readOnly
                      />

                      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-5 opacity-50" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {disabled ? (
                            <Badge variant="secondary" className="text-xs">
                              {importMsg.alreadyManaged}
                            </Badge>
                          ) : null}
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {formatDate(
                              item.published_at,
                              bcp47,
                              detail.noDate,
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="size-3" />
                            {formatCount(item.like_count, bcp47)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageCircle className="size-3" />
                            {formatCount(item.comments_count, bcp47)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug">
                          {captionPreview(item.caption, detail.noCaption)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {nextCursor ? (
            <div className="px-4 pt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loadingMore}
                onClick={() => void loadPage(nextCursor, true)}
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {importMsg.loadMore}
              </Button>
            </div>
          ) : null}
        </div>
      </AppDialog.Body>

      <AppDialog.Footer>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {importMsg.cancel}
        </Button>
        <Button
          type="button"
          onClick={() => void handleImport()}
          disabled={importing || selectedImportableCount === 0}
        >
          {importing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {importMsg.importSelected}{" "}
          {selectedImportableCount > 0 ? `(${selectedImportableCount})` : ""}
        </Button>
      </AppDialog.Footer>
    </AppDialog>
  );
}
