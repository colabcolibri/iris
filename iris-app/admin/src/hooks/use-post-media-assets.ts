import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deletePostAsset,
  fetchAssetBlob,
  listAssets,
  reorderPostAssets,
  updatePostAsset,
} from "@/lib/api";
import { getDemoMode } from "@/demo/demo-mode-context";
import { demoAssetImageUrl } from "@/demo/demo-images";
import type { AssetUserTag } from "@/lib/types";

export type PostMediaAsset = {
  id: string;
  sortOrder: number;
  previewUrl: string | null;
  previewMissing?: boolean;
  width: number | null;
  height: number | null;
  altText: string | null;
  userTags: AssetUserTag[];
};

function filenameFromStoragePath(storagePath: string): string | null {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] ?? null;
}

function reorderById<T extends { id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
): T[] | null {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return null;
  }
  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function moveByOffset<T extends { id: string }>(
  items: T[],
  assetId: string,
  offset: -1 | 1,
): T[] | null {
  const index = items.findIndex((item) => item.id === assetId);
  const targetIndex = index + offset;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return null;
  }
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function revokePreviewUrls(items: PostMediaAsset[]) {
  for (const item of items) {
    if (item.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}

function revokeUrlList(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

export function usePostMediaAssets(
  postId: string | undefined,
  refreshKey?: string,
) {
  const [items, setItems] = useState<PostMediaAsset[]>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAssets = useCallback(
    async (signal: AbortSignal) => {
      if (!postId) {
        setItems((previous) => {
          revokePreviewUrls(previous);
          return [];
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      const createdUrls: string[] = [];
      const isDemo = getDemoMode();

      try {
        const assets = await listAssets(postId);
        if (signal.aborted) {
          return;
        }

        const sorted = [...assets].sort((a, b) => a.sort_order - b.sort_order);
        const nextItems: PostMediaAsset[] = [];
        let missingCount = 0;

        for (const asset of sorted) {
          if (signal.aborted) {
            revokeUrlList(createdUrls);
            return;
          }

          const filename = filenameFromStoragePath(asset.storage_path);
          if (!filename) {
            continue;
          }

          const fileReadable = asset.file_readable ?? true;
          let previewUrl: string | null = null;
          let previewMissing = false;

          if (!fileReadable) {
            missingCount += 1;
            previewMissing = true;
          } else if (isDemo) {
            previewUrl = demoAssetImageUrl(
              postId,
              filename,
              asset.width ?? 1080,
              asset.height ?? 1350,
            );
          } else {
            try {
              const blob = await fetchAssetBlob(postId, filename);
              if (signal.aborted) {
                revokeUrlList(createdUrls);
                return;
              }
              previewUrl = URL.createObjectURL(blob);
              createdUrls.push(previewUrl);
            } catch {
              missingCount += 1;
              previewMissing = true;
            }
          }

          nextItems.push({
            id: asset.id,
            sortOrder: asset.sort_order,
            previewUrl,
            previewMissing,
            width: asset.width ?? null,
            height: asset.height ?? null,
            altText: asset.alt_text ?? null,
            userTags: asset.user_tags ?? [],
          });
        }

        if (signal.aborted) {
          revokeUrlList(createdUrls);
          return;
        }

        setItems((previous) => {
          revokePreviewUrls(previous);
          return nextItems;
        });

        if (missingCount > 0) {
          toast.warning(
            `${missingCount} slide(s) sem arquivo no servidor. Reenvie a mídia ou remova o slide.`,
          );
        }
      } catch (err) {
        revokeUrlList(createdUrls);
        if (signal.aborted) {
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Falha ao carregar mídia.",
        );
        setItems((previous) => {
          revokePreviewUrls(previous);
          return [];
        });
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [postId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadAssets(controller.signal);
    return () => {
      controller.abort();
      setItems((previous) => {
        revokePreviewUrls(previous);
        return [];
      });
    };
  }, [loadAssets, refreshKey]);

  const persistOrder = useCallback(
    async (nextItems: PostMediaAsset[]) => {
      if (!postId) {
        return;
      }
      await reorderPostAssets(
        postId,
        nextItems.map((item) => item.id),
      );
      setItems(
        nextItems.map((item, index) => ({
          ...item,
          sortOrder: index + 1,
        })),
      );
    },
    [postId],
  );

  const applyReorder = useCallback(
    (nextItems: PostMediaAsset[] | null) => {
      if (!nextItems) {
        return;
      }
      setItems(nextItems);
      void persistOrder(nextItems).catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Falha ao reordenar mídia.",
        );
        void loadAssets(new AbortController().signal);
      });
    },
    [loadAssets, persistOrder],
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      if (!postId) {
        return;
      }
      setBusyId(assetId);
      try {
        await deletePostAsset(postId, assetId);
        setItems((previous) => {
          const removed = previous.find((item) => item.id === assetId);
          if (removed?.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(removed.previewUrl);
          }
          return previous.filter((item) => item.id !== assetId);
        });
        toast.success("Mídia removida.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Falha ao remover mídia.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [postId],
  );

  const updateAssetMeta = useCallback(
    async (
      assetId: string,
      body: { alt_text?: string | null; user_tags?: AssetUserTag[] | null },
    ) => {
      if (!postId) {
        return;
      }
      setBusyId(assetId);
      try {
        const updated = await updatePostAsset(postId, assetId, body);
        setItems((previous) =>
          previous.map((item) =>
            item.id === assetId
              ? {
                  ...item,
                  altText: updated.alt_text ?? null,
                  userTags: updated.user_tags ?? [],
                }
              : item,
          ),
        );
        toast.success("Metadados da mídia salvos.");
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Falha ao salvar metadados da mídia.",
        );
        throw err;
      } finally {
        setBusyId(null);
      }
    },
    [postId],
  );

  const reorder = useCallback(
    (sourceId: string, targetId: string) => {
      applyReorder(reorderById(items, sourceId, targetId));
    },
    [applyReorder, items],
  );

  const move = useCallback(
    (assetId: string, offset: -1 | 1) => {
      applyReorder(moveByOffset(items, assetId, offset));
    },
    [applyReorder, items],
  );

  return {
    items,
    loading,
    busyId,
    deleteAsset,
    updateAssetMeta,
    reorder,
    move,
  };
}
