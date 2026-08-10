import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { deletePostAsset, fetchAssetBlob, listAssets, reorderPostAssets } from "@/lib/api";

export type PostMediaAsset = {
  id: string;
  sortOrder: number;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

function filenameFromStoragePath(storagePath: string): string | null {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] ?? null;
}

function reorderById<T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] | null {
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

function moveByOffset<T extends { id: string }>(items: T[], assetId: string, offset: -1 | 1): T[] | null {
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
    URL.revokeObjectURL(item.previewUrl);
  }
}

export function usePostMediaAssets(postId: string | undefined, refreshKey?: string) {
  const [items, setItems] = useState<PostMediaAsset[]>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!postId) {
      setItems((previous) => {
        revokePreviewUrls(previous);
        return [];
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const assets = await listAssets(postId);
      const sorted = [...assets].sort((a, b) => a.sort_order - b.sort_order);
      const nextItems: PostMediaAsset[] = [];

      for (const asset of sorted) {
        const filename = filenameFromStoragePath(asset.storage_path);
        if (!filename) {
          continue;
        }
        const blob = await fetchAssetBlob(postId, filename);
        nextItems.push({
          id: asset.id,
          sortOrder: asset.sort_order,
          previewUrl: URL.createObjectURL(blob),
          width: asset.width ?? null,
          height: asset.height ?? null,
        });
      }

      setItems((previous) => {
        revokePreviewUrls(previous);
        return nextItems;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao carregar mídia.");
      setItems((previous) => {
        revokePreviewUrls(previous);
        return [];
      });
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadAssets();
    return () => {
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
        toast.error(err instanceof Error ? err.message : "Falha ao reordenar mídia.");
        void loadAssets();
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
          if (removed) {
            URL.revokeObjectURL(removed.previewUrl);
          }
          return previous.filter((item) => item.id !== assetId);
        });
        toast.success("Mídia removida.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao remover mídia.");
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
    reorder,
    move,
  };
}
