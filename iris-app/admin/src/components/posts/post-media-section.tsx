import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { MediaTile } from "@/components/posts/media-tile";
import { PostFormSection } from "@/components/posts/post-form-section";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePostMediaAssets } from "@/hooks/use-post-media-assets";
import { cn } from "@/lib/utils";

type PostMediaSectionProps = {
  postId?: string;
  readOnly?: boolean;
  refreshKey?: string;
  mode: "create" | "edit";
  onFilesChange: (files: FileList | null) => void;
};

type PendingPreview = {
  id: string;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("failed to read image"));
    };
    image.src = url;
  });
}

export function PostMediaSection({
  postId,
  readOnly = false,
  refreshKey,
  mode,
  onFilesChange,
}: PostMediaSectionProps) {
  const { items, loading, busyId, deleteAsset, reorder, move } = usePostMediaAssets(
    postId,
    refreshKey,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const canManage = mode === "edit" && Boolean(postId);
  const showAddButton = !readOnly;

  useEffect(() => {
    if (!postId) {
      return;
    }
    setPendingPreviews((previous) => {
      for (const preview of previous) {
        URL.revokeObjectURL(preview.previewUrl);
      }
      return [];
    });
  }, [postId]);

  useEffect(() => {
    return () => {
      setPendingPreviews((previous) => {
        for (const preview of previous) {
          URL.revokeObjectURL(preview.previewUrl);
        }
        return [];
      });
    };
  }, []);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextPending: PendingPreview[] = [];
    for (const file of [...files]) {
      try {
        const dimensions = await readImageDimensions(file);
        nextPending.push({
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
          width: dimensions.width,
          height: dimensions.height,
        });
      } catch {
        nextPending.push({
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
          width: null,
          height: null,
        });
      }
    }

    setPendingPreviews((previous) => [...previous, ...nextPending]);
    onFilesChange(files);
    setInputKey((value) => value + 1);
  }

  const addMediaControl = showAddButton ? (
    <label
      className={buttonVariants({
        variant: "outline",
        size: "sm",
        className: "h-8 cursor-pointer gap-1.5",
      })}
    >
      <ImagePlus className="size-3.5" />
      Adicionar mídia
      <Input
        key={inputKey}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => void handleFilesSelected(event.target.files)}
      />
    </label>
  ) : null;

  const gridItems = useMemo(() => {
    if (canManage) {
      return items;
    }
    return pendingPreviews.map((preview) => ({
      id: preview.id,
      sortOrder: 0,
      previewUrl: preview.previewUrl,
      width: preview.width,
      height: preview.height,
    }));
  }, [canManage, items, pendingPreviews]);

  return (
    <PostFormSection
      title="Mídia"
      description={
        canManage
          ? "PNG, JPEG ou WebP · 4 por linha · arraste ou use as setas para reordenar"
          : "PNG, JPEG ou WebP · salve o rascunho para reordenar e remover"
      }
      action={addMediaControl}
    >
      {loading && canManage ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando mídia…
        </div>
      ) : gridItems.length === 0 ? (
        <div
          className={cn(
            "rounded-[var(--iris-radius-lg)] border border-dashed border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground shadow-none",
            showAddButton && "sm:py-14",
          )}
        >
          {readOnly
            ? "Sem mídia nesta publicação."
            : canManage
              ? "Nenhuma mídia ainda. Use “Adicionar mídia” acima."
              : "Nenhuma mídia selecionada. Use “Adicionar mídia” e salve o rascunho."}
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gridItems.map((item, index) => (
            <MediaTile
              key={item.id}
              item={item}
              index={index}
              total={gridItems.length}
              readOnly={readOnly || !canManage}
              busy={busyId === item.id}
              isDragging={draggingId === item.id}
              isDragOver={dragOverId === item.id && draggingId !== item.id}
              onDelete={() => void deleteAsset(item.id)}
              onMoveLeft={() => move(item.id, -1)}
              onMoveRight={() => move(item.id, 1)}
              onDragStart={() => setDraggingId(item.id)}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragOver={(event) => {
                if (readOnly || !canManage || !draggingId) {
                  return;
                }
                event.preventDefault();
                setDragOverId(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (readOnly || !canManage || !draggingId) {
                  return;
                }
                reorder(draggingId, item.id);
                setDraggingId(null);
                setDragOverId(null);
              }}
            />
          ))}
        </div>
      )}
    </PostFormSection>
  );
}
