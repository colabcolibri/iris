import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { AssetUserTagsEditor } from "@/components/posts/asset-user-tags-editor";
import { MediaTile } from "@/components/posts/media-tile";
import { PostFormSection } from "@/components/posts/post-form-section";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePostMediaAssets } from "@/hooks/use-post-media-assets";
import type { AssetUserTag } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostMediaSectionProps = {
  postId?: string;
  readOnly?: boolean;
  refreshKey?: string;
  mode: "create" | "edit";
  onFilesChange: (files: FileList | null) => void;
  onFilesReplace: (files: FileList | null) => void;
};

type PendingPreview = {
  id: string;
  previewUrl: string;
  width: number | null;
  height: number | null;
  file: File;
};

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
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
  onFilesReplace,
}: PostMediaSectionProps) {
  const { items, loading, busyId, deleteAsset, updateAssetMeta, reorder, move } =
    usePostMediaAssets(postId, refreshKey);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metaEditorOpen, setMetaEditorOpen] = useState(false);
  const [altDraft, setAltDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState<AssetUserTag[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);

  const canManage = mode === "edit" && Boolean(postId);
  const showAddButton = !readOnly;

  useEffect(() => {
    if (!canManage || items.length === 0) {
      setSelectedId(null);
      setMetaEditorOpen(false);
      return;
    }
    setSelectedId((current) => {
      if (current && items.some((item) => item.id === current)) {
        return current;
      }
      return items[0]?.id ?? null;
    });
  }, [canManage, items]);

  useEffect(() => {
    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setMetaEditorOpen(false);
    }
  }, [items, selectedId]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selected) {
      setAltDraft("");
      setTagsDraft([]);
      return;
    }
    setAltDraft(selected.altText ?? "");
    setTagsDraft(selected.userTags);
  }, [selected]);

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
          file,
        });
      } catch {
        nextPending.push({
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
          width: null,
          height: null,
          file,
        });
      }
    }

    setPendingPreviews((previous) => [...previous, ...nextPending]);
    onFilesChange(files);
    setInputKey((value) => value + 1);
  }

  async function saveSelectedMeta() {
    if (!selected || !canManage) {
      return;
    }
    setSavingMeta(true);
    try {
      await updateAssetMeta(selected.id, {
        alt_text: altDraft.trim() || null,
        user_tags: tagsDraft,
      });
    } finally {
      setSavingMeta(false);
    }
  }

  function removePendingPreview(previewId: string) {
    setPendingPreviews((previous) => {
      const next = previous.filter((preview) => preview.id !== previewId);
      const removed = previous.find((preview) => preview.id === previewId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const transfer = new DataTransfer();
      for (const preview of next) {
        transfer.items.add(preview.file);
      }
      onFilesReplace(transfer.files.length > 0 ? transfer.files : null);
      return next;
    });
  }

  async function handleDelete(itemId: string) {
    if (canManage) {
      await deleteAsset(itemId);
      return;
    }
    removePendingPreview(itemId);
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
      altText: null as string | null,
      userTags: [] as AssetUserTag[],
    }));
  }, [canManage, items, pendingPreviews]);

  return (
    <PostFormSection
      title="Mídia"
      description={
        canManage
          ? "PNG, JPEG ou WebP · barrinha: ordenar, metadados (tags) e remover"
          : "PNG, JPEG ou WebP · salve o rascunho para editar alt text, tags e ordem"
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
            "rounded-(--iris-radius-lg) border border-dashed border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground shadow-none",
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
        <div className="space-y-4">
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gridItems.map((item, index) => (
              <MediaTile
                key={item.id}
                item={item}
                index={index}
                total={gridItems.length}
                readOnly={readOnly}
                canReorder={canManage}
                canEditMeta={canManage}
                selectable={canManage}
                selected={canManage && selectedId === item.id}
                metaOpen={
                  canManage && metaEditorOpen && selectedId === item.id
                }
                busy={busyId === item.id}
                isDragging={draggingId === item.id}
                isDragOver={dragOverId === item.id && draggingId !== item.id}
                onSelect={() => setSelectedId(item.id)}
                onToggleMeta={() => {
                  if (selectedId === item.id && metaEditorOpen) {
                    setMetaEditorOpen(false);
                    return;
                  }
                  setSelectedId(item.id);
                  setMetaEditorOpen(true);
                }}
                onDelete={() => {
                  if (selectedId === item.id) {
                    setMetaEditorOpen(false);
                  }
                  void handleDelete(item.id);
                }}
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

          {canManage && selected && metaEditorOpen ? (
            <div className="space-y-3 rounded-(--iris-radius-sm) border border-border bg-muted/10 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Slide{" "}
                    {items.findIndex((item) => item.id === selected.id) + 1} —
                    acessibilidade e tags
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tags aqui ≠ colaboradores da aba Legenda.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setMetaEditorOpen(false)}
                >
                  Fechar
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asset-alt-text">Texto alternativo</Label>
                <Textarea
                  id="asset-alt-text"
                  value={altDraft}
                  onChange={(event) => setAltDraft(event.target.value)}
                  rows={2}
                  placeholder="Descreva o que aparece na imagem…"
                  disabled={readOnly || savingMeta || busyId === selected.id}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags na imagem</Label>
                <AssetUserTagsEditor
                  key={selected.id}
                  previewUrl={selected.previewUrl}
                  width={selected.width}
                  height={selected.height}
                  tags={tagsDraft}
                  onChange={setTagsDraft}
                  disabled={readOnly || savingMeta || busyId === selected.id}
                />
              </div>
              {!readOnly ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void saveSelectedMeta()}
                  disabled={savingMeta || busyId === selected.id}
                >
                  {savingMeta ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Salvar metadados do slide
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </PostFormSection>
  );
}
