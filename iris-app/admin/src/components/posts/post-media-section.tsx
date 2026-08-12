import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { MediaTile } from "@/components/posts/media-tile";
import { PostFormSection } from "@/components/posts/post-form-section";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function formatUserTagsInput(
  tags: Array<{ username: string; x: number; y: number }>,
): string {
  return tags
    .map((tag) =>
      tag.x === 0.5 && tag.y === 0.5
        ? tag.username
        : `${tag.username} ${tag.x} ${tag.y}`,
    )
    .join(", ");
}

function parseUserTagsInput(
  raw: string,
): Array<{ username: string; x: number; y: number }> {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const tags: Array<{ username: string; x: number; y: number }> = [];
  for (const part of parts) {
    const tokens = part.split(/\s+/).filter(Boolean);
    const username = (tokens[0] ?? "").replace(/^@+/, "");
    if (!username) continue;
    const x = tokens[1] !== undefined ? Number(tokens[1]) : 0.5;
    const y = tokens[2] !== undefined ? Number(tokens[2]) : 0.5;
    tags.push({
      username,
      x: Number.isFinite(x) ? x : 0.5,
      y: Number.isFinite(y) ? y : 0.5,
    });
  }
  return tags;
}

export function PostMediaSection({
  postId,
  readOnly = false,
  refreshKey,
  mode,
  onFilesChange,
}: PostMediaSectionProps) {
  const { items, loading, busyId, deleteAsset, updateAssetMeta, reorder, move } =
    usePostMediaAssets(postId, refreshKey);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const canManage = mode === "edit" && Boolean(postId);
  const showAddButton = !readOnly;

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selected) {
      setAltDraft("");
      setTagsDraft("");
      return;
    }
    setAltDraft(selected.altText ?? "");
    setTagsDraft(formatUserTagsInput(selected.userTags));
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

  async function saveSelectedMeta() {
    if (!selected || !canManage) {
      return;
    }
    setSavingMeta(true);
    try {
      await updateAssetMeta(selected.id, {
        alt_text: altDraft.trim() || null,
        user_tags: parseUserTagsInput(tagsDraft),
      });
    } finally {
      setSavingMeta(false);
    }
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
      userTags: [] as Array<{ username: string; x: number; y: number }>,
    }));
  }, [canManage, items, pendingPreviews]);

  return (
    <PostFormSection
      title="Mídia"
      description={
        canManage
          ? "PNG, JPEG ou WebP · clique num slide para alt text e tags · arraste para reordenar"
          : "PNG, JPEG ou WebP · salve o rascunho para reordenar, alt text e tags"
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
                readOnly={readOnly || !canManage}
                selectable={canManage}
                selected={canManage && selectedId === item.id}
                busy={busyId === item.id}
                isDragging={draggingId === item.id}
                isDragOver={dragOverId === item.id && draggingId !== item.id}
                onSelect={() => setSelectedId(item.id)}
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

          {canManage && selected ? (
            <div className="space-y-3 rounded-(--iris-radius-sm) border border-border bg-muted/10 p-3">
              <p className="text-sm font-medium text-foreground">
                Slide {items.findIndex((item) => item.id === selected.id) + 1} —
                acessibilidade e tags
              </p>
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
                <Label htmlFor="asset-user-tags">Tags na imagem</Label>
                <Input
                  id="asset-user-tags"
                  value={tagsDraft}
                  onChange={(event) => setTagsDraft(event.target.value)}
                  placeholder="user1, user2 0.3 0.7"
                  disabled={readOnly || savingMeta || busyId === selected.id}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Usernames separados por vírgula. Opcional: `user x y` (0–1).
                  Centro padrão 0.5 0.5. Não é collab do post.
                </p>
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
