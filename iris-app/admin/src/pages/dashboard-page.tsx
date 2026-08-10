import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CalendarView } from "@/components/calendar/calendar-view";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PostDialog, type PostDialogMode } from "@/components/posts/post-dialog";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useMetaSession } from "@/contexts/meta-session-context";
import { useDashboardView } from "@/hooks/use-dashboard-view";
import {
  createPost,
  fetchPost,
  fetchPosts,
  listAssets,
  subscribeRealtimeEvents,
  UnauthorizedError,
  updatePost,
  uploadAsset,
} from "@/lib/api";
import { monthRange, toDatetimeLocalFromIso, toIsoFromDatetimeLocal } from "@/lib/datetime";
import type { Post, PostStatus, ReplyMode } from "@/lib/types";

export function DashboardPage() {
  const { timezone } = useAppSettings();
  const { meta } = useMetaSession();
  const { view } = useDashboardView();
  const { confirm } = useConfirmDialog();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<PostDialogMode | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [replyMode, setReplyMode] = useState<ReplyMode>("off");
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    const data =
      view === "calendar"
        ? await fetchPosts({ ...monthRange(cursor, timezone), calendarOnly: true })
        : await fetchPosts();
    setPosts(data);
  }, [view, cursor, timezone]);

  const handleAuthError = useCallback((err: unknown) => {
    // 401 invalida a sessão no AuthSessionProvider; ProtectedRoute redireciona.
    return err instanceof UnauthorizedError;
  }, []);

  useEffect(() => {
    void loadPosts().catch((err) => {
      if (!handleAuthError(err)) toast.error("Falha ao carregar postagens.");
    });
  }, [loadPosts, handleAuthError]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_connected") === "1") toast.success("Instagram conectado com sucesso.");
    if (params.get("meta_error")) toast.error("Falha ao conectar Instagram.");
    if (params.has("meta_connected") || params.has("meta_error")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents({
      onPostsChanged: () => {
        void loadPosts();
      },
      onCommentsChanged: (payload) => {
        if (payload.post_id && payload.post_id === selectedPost?.id) {
          void fetchPost(payload.post_id).then(setSelectedPost);
        }
      },
    });
    return unsubscribe;
  }, [loadPosts, selectedPost?.id]);

  function openCreate() {
    setSelectedPost(null);
    setDialogMode("create");
    setCaption("");
    setScheduledAt("");
    setReplyMode("off");
    setFiles(null);
    setError("");
    setDialogOpen(true);
  }

  function openPost(post: Post) {
    setSelectedPost(post);
    setDialogMode("edit");
    setCaption(post.caption ?? "");
    setScheduledAt(toDatetimeLocalFromIso(post.scheduled_at, timezone));
    setReplyMode(post.reply_mode ?? (post.auto_reply_enabled ? "auto" : "off"));
    setFiles(null);
    setError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedPost(null);
    setError("");
  }

  async function changeStatus(post: Post, status: PostStatus) {
    if (status === "cancelled") {
      const ok = await confirm({
        title: "Cancelar postagem?",
        description: "A postagem sai do fluxo editorial ativo. Você poderá restaurá-la como rascunho depois.",
        confirmLabel: "Cancelar postagem",
        confirmPhrase: "CANCELAR",
        variant: "destructive",
      });
      if (!ok) return;
    }

    try {
      await updatePost(post.id, { status });
      await loadPosts();
      if (selectedPost?.id === post.id) {
        const updated = await fetchPost(post.id);
        setSelectedPost(updated);
        setScheduledAt(toDatetimeLocalFromIso(updated.scheduled_at, timezone));
      }
      const message =
        status === "cancelled"
          ? "Postagem cancelada."
          : status === "draft" && post.status === "scheduled"
            ? "Postagem desagendada."
            : status === "draft"
              ? "Postagem voltou para rascunho."
              : "Status atualizado.";
      toast.success(message);
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error(err instanceof Error ? err.message : "Falha ao atualizar status.");
      }
    }
  }

  async function revertToDraft() {
    if (!selectedPost) return;
    setSaving(true);
    setError("");
    try {
      await updatePost(selectedPost.id, { status: "draft" });
      await loadPosts();
      const updated = await fetchPost(selectedPost.id);
      setSelectedPost(updated);
      toast.success(
        selectedPost.status === "scheduled"
          ? "Postagem desagendada."
          : "Postagem restaurada como rascunho.",
      );
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err instanceof Error ? err.message : "Falha ao atualizar.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function savePost(schedule: boolean) {
    setSaving(true);
    setError("");
    try {
      const scheduledIso = toIsoFromDatetimeLocal(scheduledAt, timezone);
      let postId = selectedPost?.id;

      if (!postId) {
        const created = await createPost({
          caption,
          channel: "instagram",
          scheduled_at: scheduledIso,
        });
        postId = created.id;
      } else {
        await updatePost(postId, {
          caption,
          scheduled_at: scheduledIso,
          reply_mode: replyMode,
        });
      }

      if (files && files.length > 0) {
        let sortOrder = (await listAssets(postId)).length + 1;
        for (const file of [...files]) {
          await uploadAsset(postId, file, sortOrder);
          sortOrder += 1;
        }
      }

      if (schedule) {
        if (!meta?.connected) throw new Error("Conecte Instagram antes de agendar.");
        if (!scheduledIso) throw new Error("Informe data e hora para agendar.");
        await updatePost(postId, { status: "scheduled", scheduled_at: scheduledIso });
      }

      await loadPosts();
      const post = await fetchPost(postId);
      setSelectedPost(post);
      setDialogMode("edit");
      toast.success(schedule ? "Postagem agendada." : "Rascunho salvo.");
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {view === "kanban" && (
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 px-8 pt-8 pb-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
              Pipeline editorial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize rascunhos, agendamentos e publicações.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="h-9 shrink-0 rounded-full px-4 font-semibold uppercase tracking-wide shadow-sm sm:px-6"
          >
            <Plus className="mr-2 size-4" />
            Nova postagem
          </Button>
        </header>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-8 pb-8">
        {view === "kanban" ? (
          <KanbanBoard
            posts={posts}
            timeZone={timezone}
            onOpenPost={openPost}
            onStatusChange={(post, status) => void changeStatus(post, status)}
          />
        ) : (
          <CalendarView
            posts={posts}
            cursor={cursor}
            selectedId={selectedPost?.id ?? null}
            timeZone={timezone}
            onCursorChange={setCursor}
            onSelect={openPost}
            onCreatePost={openCreate}
          />
        )}
      </div>

      <PostDialog
        open={dialogOpen}
        mode={dialogMode}
        post={selectedPost}
        metaConnected={Boolean(meta?.connected)}
        metaIgUsername={meta?.igUsername}
        timeZone={timezone}
        saving={saving}
        error={error}
        caption={caption}
        scheduledAt={scheduledAt}
        replyMode={replyMode}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
        onCaptionChange={setCaption}
        onScheduledAtChange={setScheduledAt}
        onReplyModeChange={setReplyMode}
        onFilesChange={setFiles}
        onSaveDraft={() => void savePost(false)}
        onSchedule={() => void savePost(true)}
        onRevertToDraft={
          selectedPost?.status === "scheduled" || selectedPost?.status === "cancelled"
            ? () => void revertToDraft()
            : undefined
        }
        onRetryDraft={
          selectedPost?.status === "failed"
            ? () => {
                void updatePost(selectedPost.id, { status: "draft" })
                  .then(() => fetchPost(selectedPost.id))
                  .then((post) => {
                    setSelectedPost(post);
                    toast.success("Postagem voltou para rascunho.");
                    return loadPosts();
                  })
                  .catch((err) => {
                    if (!handleAuthError(err)) {
                      setError(err instanceof Error ? err.message : "Falha ao atualizar.");
                    }
                  });
              }
            : undefined
        }
        onRetrySchedule={
          selectedPost?.status === "failed" ? () => void savePost(true) : undefined
        }
      />
    </>
  );
}
