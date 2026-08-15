import { Button } from "@/components/ui/button";
import type { PostMediaAsset } from "@/hooks/use-post-media-assets";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageOff,
  Loader2,
  Tags,
  Trash2,
} from "lucide-react";
import type { DragEvent } from "react";

type MediaTileProps = {
  item: PostMediaAsset;
  index: number;
  total: number;
  readOnly?: boolean;
  busy?: boolean;
  selected?: boolean;
  selectable?: boolean;
  canReorder?: boolean;
  canEditMeta?: boolean;
  metaOpen?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onSelect?: () => void;
  onToggleMeta?: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
};

export function MediaTile({
  item,
  index,
  total,
  readOnly = false,
  busy = false,
  selected = false,
  selectable = false,
  canReorder = true,
  canEditMeta = false,
  metaOpen = false,
  isDragging = false,
  isDragOver = false,
  onSelect,
  onToggleMeta,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: MediaTileProps) {
  const aspectRatio =
    item.width && item.height && item.width > 0 && item.height > 0
      ? `${item.width} / ${item.height}`
      : undefined;
  const showReorder = !readOnly && canReorder && total > 1;
  const showToolbar = !readOnly;

  return (
    <div className="min-w-0 space-y-1.5">
      <div
        role={selectable ? "button" : undefined}
        tabIndex={selectable ? 0 : undefined}
        aria-pressed={selectable ? selected : undefined}
        onClick={() => {
          if (selectable) {
            onSelect?.();
          }
        }}
        onKeyDown={(event) => {
          if (!selectable) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect?.();
          }
        }}
        draggable={!readOnly && canReorder && !busy}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "group relative min-w-0 overflow-hidden rounded-(--iris-radius-sm) border border-border bg-muted/20 transition-colors shadow-none",
          isDragOver && "border-primary ring-2 ring-primary/25",
          isDragging && "scale-[0.98] opacity-50",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          selectable && "cursor-pointer",
          !readOnly &&
            canReorder &&
            !selectable &&
            "cursor-grab active:cursor-grabbing",
          !readOnly && canReorder && selectable && "active:cursor-grabbing",
        )}
      >
        <div
          className="relative w-full"
          style={aspectRatio ? { aspectRatio } : { minHeight: "9rem" }}
        >
          {item.previewMissing || !item.previewUrl ? (
            <div
              className="flex size-full flex-col items-center justify-center gap-2 bg-muted/40 px-3 text-center text-muted-foreground"
              role="img"
              aria-label={`Slide ${index + 1} sem arquivo`}
            >
              <ImageOff className="size-6 shrink-0 opacity-70" aria-hidden />
              <span className="text-xs leading-snug">
                Arquivo ausente no servidor
              </span>
            </div>
          ) : (
            <img
              src={item.previewUrl}
              alt={item.altText?.trim() || ""}
              className="size-full object-contain"
              draggable={false}
            />
          )}
          {item.userTags.map((tag, tagIndex) => (
            <span
              key={`${tag.username}-${tagIndex}`}
              className="pointer-events-none absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-primary"
              style={{
                left: `${tag.x * 100}%`,
                top: `${tag.y * 100}%`,
              }}
              title={`@${tag.username}`}
            />
          ))}
        </div>

        <span className="absolute top-2 left-2 rounded-(--iris-radius-sm) bg-background/90 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground shadow-none">
          {index + 1}
        </span>

        {(item.altText?.trim() || item.userTags.length > 0) && (
          <span className="absolute bottom-2 left-2 rounded-(--iris-radius-sm) bg-background/90 px-1.5 py-0.5 text-xs font-medium text-muted-foreground shadow-none">
            {[
              item.altText?.trim() ? "alt" : null,
              item.userTags.length > 0 ? `tag ${item.userTags.length}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </div>

      {showToolbar ? (
        <div className="flex h-8 w-full items-center justify-between gap-1 rounded-(--iris-radius-sm) border border-border bg-muted/20 px-1">
          <div className="flex min-w-0 items-center gap-0.5">
            {showReorder ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7"
                  onClick={onMoveLeft}
                  disabled={busy || index === 0}
                  aria-label={`Mover slide ${index + 1} para a esquerda`}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 cursor-grab active:cursor-grabbing"
                  disabled={busy}
                  aria-label={`Arrastar slide ${index + 1}`}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <GripVertical className="size-3.5 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7"
                  onClick={onMoveRight}
                  disabled={busy || index === total - 1}
                  aria-label={`Mover slide ${index + 1} para a direita`}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </>
            ) : (
              <span className="truncate px-1.5 text-xs text-muted-foreground">
                Slide {index + 1}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {canEditMeta ? (
              <Button
                type="button"
                variant={metaOpen ? "secondary" : "ghost"}
                size="icon-sm"
                className="size-7"
                onClick={onToggleMeta}
                disabled={busy}
                aria-label={
                  metaOpen
                    ? `Fechar metadados do slide ${index + 1}`
                    : `Abrir metadados do slide ${index + 1}`
                }
                aria-pressed={metaOpen}
                title="Alt text e tags"
              >
                <Tags className="size-3.5" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={busy}
              aria-label={`Remover slide ${index + 1}`}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
