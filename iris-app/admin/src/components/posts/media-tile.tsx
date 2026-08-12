import { Button } from "@/components/ui/button";
import type { PostMediaAsset } from "@/hooks/use-post-media-assets";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
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
  isDragging?: boolean;
  isDragOver?: boolean;
  onSelect?: () => void;
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
  isDragging = false,
  isDragOver = false,
  onSelect,
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

  return (
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
      draggable={!readOnly && !busy}
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
        !readOnly && !selectable && "cursor-grab active:cursor-grabbing",
        !readOnly && selectable && "active:cursor-grabbing",
      )}
    >
      <div
        className="flex w-full items-center justify-center p-2"
        style={aspectRatio ? { aspectRatio } : { minHeight: "9rem" }}
      >
        <img
          src={item.previewUrl}
          alt={item.altText?.trim() || ""}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
      </div>

      <span className="absolute top-2 left-2 rounded-(--iris-radius-sm) bg-background/90 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground shadow-none">
        {index + 1}
      </span>

      {!readOnly ? (
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-0.5 rounded-(--iris-radius-sm) border border-border bg-background/95 p-0.5 shadow-none",
            "opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
          )}
          onClick={(event) => event.stopPropagation()}
        >
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
      ) : null}
    </div>
  );
}
