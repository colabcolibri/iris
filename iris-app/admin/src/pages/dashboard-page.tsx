import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CalendarView } from "@/components/calendar/calendar-view";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PostDialog, type PostDialogMode } from "@/components/posts/post-dialog";
import {
  createPost,
  fetchMetaHealth,
  fetchMetaStatus,
  fetchPost,
  fetchPosts,
  listAssets,
  logout,
  subscribeRealtimeEvents,
  UnauthorizedError,
  updatePost,
  uploadAsset,
} from "@/lib/api";
import { monthRange } from "@/lib/date-utils";
import { toDatetimeLocalFromIso, toIsoFromDatetimeLocal } from "@/lib/datetime";
import type { MetaStatus, Post, PostStatus } from "@/lib/types";

type ViewMode = "calendar" | "kanban";

export function DashboardPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("kanban");
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<PostDialogMode | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    const data =
      view === "calendar"
        ? await fetchPosts(monthRange(cursor))
        : await fetchPosts();
    setPosts(data);
  }, [view, cursor]);

  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) {
        navigate("/login", { replace: true });
        return true;
      }
      return false;
    },
    [navigate],
  );

  useEffect(() => {
    void fetchMetaStatus()
      .then(setMeta)
      .catch((err) => {
        if (handleAuthError(err)) return;
        setMeta({
          connected: false,
          igUsername: null,
          tokenExpired: false,
        });
        toast.error("Falha ao carregar status da Meta.");
      });
  }, [handleAuthError]);

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
    setAutoReply(false);
    setFiles(null);
    setError("");
    setDialogOpen(true);
  }

  function openPost(post: Post) {
    setSelectedPost(post);
    setDialogMode("edit");
    setCaption(post.caption ?? "");
    setScheduledAt(toDatetimeLocalFromIso(post.scheduled_at));
    setAutoReply(Boolean(post.auto_reply_enabled));
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
    try {
      await updatePost(post.id, { status });
      await loadPosts();
      if (selectedPost?.id === post.id) {
        const updated = await fetchPost(post.id);
        setSelectedPost(updated);
      }
      toast.success("Status atualizado.");
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error(err instanceof Error ? err.message : "Falha ao atualizar status.");
      }
    }
  }

  async function savePost(schedule: boolean) {
    setSaving(true);
    setError("");
    try {
      const scheduledIso = toIsoFromDatetimeLocal(scheduledAt);
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
          auto_reply_enabled: autoReply,
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
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <AppHeader
        meta={meta}
        onNewPost={openCreate}
        onLogout={() => {
          void logout().finally(() => navigate("/login", { replace: true }));
        }}
        onMetaHealth={() => {
          void fetchMetaHealth()
            .then((result) => {
              if (result.ok) toast.success("Conexão com a Meta OK.");
              else toast.error(result.message ?? "Falha na conexão.");
            })
            .catch(() => toast.error("Falha ao testar conexão."));
        }}
      />

      <div className="flex min-h-0 flex-1">
        <AppSidebar view={view} onViewChange={setView} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {view === "kanban" && (
            <header className="shrink-0 px-8 pt-8 pb-4">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
                Pipeline editorial
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Organize rascunhos, agendamentos e publicações.
              </p>
            </header>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-8 pb-8">
            {view === "kanban" ? (
              <KanbanBoard
                posts={posts}
                onOpenPost={openPost}
                onStatusChange={(post, status) => void changeStatus(post, status)}
              />
            ) : (
              <CalendarView
                posts={posts}
                cursor={cursor}
                selectedId={selectedPost?.id ?? null}
                onCursorChange={setCursor}
                onSelect={openPost}
              />
            )}
          </div>
        </main>
      </div>

      <PostDialog
        open={dialogOpen}
        mode={dialogMode}
        post={selectedPost}
        metaConnected={Boolean(meta?.connected)}
        metaIgUsername={meta?.igUsername}
        saving={saving}
        error={error}
        caption={caption}
        scheduledAt={scheduledAt}
        autoReply={autoReply}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
        onCaptionChange={setCaption}
        onScheduledAtChange={setScheduledAt}
        onAutoReplyChange={setAutoReply}
        onFilesChange={setFiles}
        onSaveDraft={() => void savePost(false)}
        onSchedule={() => void savePost(true)}
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
    </div>
  );
}
