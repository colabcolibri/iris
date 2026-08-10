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
import { browseMetaMedia, importMonitoredPostsBatch } from "@/lib/api";
import type { BrowseableMediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type ImportPostsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

function captionPreview(caption: string | null): string {
  const text = caption?.trim();
  if (!text) {
    return "(sem legenda)";
  }
  if (text.length <= 60) {
    return text;
  }
  return `${text.slice(0, 60)}…`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "sem data";
  }
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCount(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function ImportPostsDialog({ open, onOpenChange, onImported }: ImportPostsDialogProps) {
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
    () => selectedIds.filter((id) => importableItems.some((item) => item.ig_media_id === id)).length,
    [importableItems, selectedIds],
  );

  const loadPage = useCallback(async (cursor?: string | null, append = false) => {
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

      setItems((current) => (append ? [...current, ...page.items] : page.items));
      setNextCursor(page.next_cursor);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar publicações.";
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

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
      setSelectedIds((current) => current.filter((id) => !importableIds.includes(id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...importableIds])]);
  };

  const handleImport = async () => {
    if (selectedImportableCount === 0) {
      toast.error("Selecione ao menos uma publicação para importar.");
      return;
    }

    setImporting(true);
    try {
      const result = await importMonitoredPostsBatch(selectedIds);
      const importedCount = result.imported.length;
      const skippedCount = result.skipped.length;

      if (importedCount > 0) {
        toast.success(
          `${importedCount} publicação${importedCount === 1 ? "" : "ões"} importada${importedCount === 1 ? "" : "s"}.`,
        );
        onImported();
      }

      if (skippedCount > 0 && importedCount === 0) {
        toast.error("Nenhuma publicação nova foi importada.");
      } else if (skippedCount > 0) {
        toast.message(`${skippedCount} ignorada(s) (já gerenciadas ou inválidas).`);
      }

      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao importar publicações.";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} size="xl">
      <AppDialog.Header
        title="Importar da Meta"
        description="Selecione publicações recentes da conta conectada para monitorar comentários no Iris."
      />

      <AppDialog.Body className="px-0">
        <div className="border-b px-6 pb-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={
                importableItems.length > 0 &&
                importableItems.every((item) => selectedIds.includes(item.ig_media_id))
              }
              disabled={importableItems.length === 0 || loading}
              onChange={toggleSelectAll}
            />
            Selecionar todas disponíveis ({importableItems.length})
          </label>
        </div>

        <div className="min-h-[18rem] px-2 py-2">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Carregando publicações…
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">
              Nenhuma publicação encontrada na conta conectada.
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
                            <Badge variant="secondary" className="text-[10px]">
                              Já gerenciada
                            </Badge>
                          ) : null}
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {formatDate(item.published_at)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="size-3" />
                            {formatCount(item.like_count)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageCircle className="size-3" />
                            {formatCount(item.comments_count)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug">
                          {captionPreview(item.caption)}
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
                Carregar mais 20
              </Button>
            </div>
          ) : null}
        </div>
      </AppDialog.Body>

      <AppDialog.Footer>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleImport()}
          disabled={importing || selectedImportableCount === 0}
        >
          {importing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Importar {selectedImportableCount > 0 ? `(${selectedImportableCount})` : ""}
        </Button>
      </AppDialog.Footer>
    </AppDialog>
  );
}
