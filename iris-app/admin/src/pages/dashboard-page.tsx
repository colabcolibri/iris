import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CalendarListView } from "@/components/calendar/calendar-list-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import {
  PostDialog,
  type PostDialogMode,
} from "@/components/posts/post-dialog";
import type { PostDialogFooterActionId } from "@/components/posts/post-dialog-footer-actions";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useMetaSession } from "@/contexts/meta-session-context";
import { useDashboardView } from "@/hooks/use-dashboard-view";
import {
  createPost,
  deletePost,
  fetchPost,
  fetchPosts,
  listAssets,
  publishPostNow,
  purgeCancelledPost,
  subscribeRealtimeEvents,
  UnauthorizedError,
  updatePost,
  uploadAsset,
} from "@/lib/api";
import {
  monthRange,
  toDatetimeLocalFromIso,
  toIsoFromDatetimeLocal,
} from "@/lib/datetime";
import type { Post, PostStatus, PostReplyModeSetting } from "@/lib/types";

export function DashboardPage() {
  const { timezone, replyMode: globalReplyMode } = useAppSettings();
  const { meta } = useMetaSession();
  const { view } = useDashboardView();
  const { confirm } = useConfirmDialog();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<PostDialogMode | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState("");
  const [collaboratorsText, setCollaboratorsText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [replyMode, setReplyMode] = useState<PostReplyModeSetting>("inherit");
  const [carouselSummary, setCarouselSummary] = useState("");
  const [replyPrompt, setReplyPrompt] = useState("");
  const [silenceSoul, setSilenceSoul] = useState(false);
  const [silencePage, setSilencePage] = useState(false);
  const [silenceKnowledge, setSilenceKnowledge] = useState(false);
  const [silenceRestrictions, setSilenceRestrictions] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<PostDialogFooterActionId | null>(
    null,
  );
  const [operationStatus, setOperationStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  function beginBusy(action: PostDialogFooterActionId, status?: string) {
    setSaving(true);
    setBusyAction(action);
    setOperationStatus(status ?? null);
    setError("");
  }

  function endBusy() {
    setSaving(false);
    setBusyAction(null);
    setOperationStatus(null);
  }
  const loadPosts = useCallback(async () => {
    const data =
      view === "calendar" || view === "list"
        ? await fetchPosts({
            ...monthRange(cursor, timezone),
            calendarOnly: true,
          })
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
    if (params.get("meta_connected") === "1")
      toast.success("Instagram conectado com sucesso.");
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

  function parseCollaboratorsInput(raw: string): string[] {
    return raw
      .split(/[\s,]+/)
      .map((item) => item.trim().replace(/^@+/, ""))
      .filter(Boolean)
      .slice(0, 3);
  }

  function formatCollaborators(list: string[] | undefined): string {
    return (list ?? []).join(", ");
  }

  function resetEditorialFields() {
    setCarouselSummary("");
    setReplyPrompt("");
    setSilenceSoul(false);
    setSilencePage(false);
    setSilenceKnowledge(false);
    setSilenceRestrictions(false);
  }

  function loadEditorialFieldsFromPost(post: Post) {
    setCollaboratorsText(formatCollaborators(post.collaborators));
    setCarouselSummary(post.carousel_summary ?? "");
    setReplyPrompt(post.reply_prompt ?? "");
    setSilenceSoul(post.silence_soul ?? false);
    setSilencePage(post.silence_page ?? false);
    setSilenceKnowledge(post.silence_knowledge ?? false);
    setSilenceRestrictions(post.silence_restrictions ?? false);
  }

  function buildCreatePostBody() {
    return {
      caption,
      channel: "instagram",
      collaborators: parseCollaboratorsInput(collaboratorsText),
      carousel_summary: carouselSummary.trim() || null,
      reply_prompt: replyPrompt.trim() || null,
      silence_soul: silenceSoul,
      silence_page: silencePage,
      silence_knowledge: silenceKnowledge,
      silence_restrictions: silenceRestrictions,
    };
  }

  function openCreate() {
    setSelectedPost(null);
    setDialogMode("create");
    setCaption("");
    setCollaboratorsText("");
    setScheduledAt("");
    setReplyMode("inherit");
    resetEditorialFields();
    setFiles(null);
    setError("");
    setDialogOpen(true);
  }

  function openPost(post: Post) {
    setSelectedPost(post);
    setDialogMode("edit");
    setCaption(post.caption ?? "");
    setCollaboratorsText(formatCollaborators(post.collaborators));
    setScheduledAt(toDatetimeLocalFromIso(post.scheduled_at, timezone));
    setReplyMode(
      post.reply_mode ?? (post.auto_reply_enabled ? "auto" : "inherit"),
    );
    loadEditorialFieldsFromPost(post);
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
        description:
          "A postagem sai do fluxo editorial ativo. Você poderá restaurá-la como rascunho depois.",
        confirmLabel: "Cancelar postagem",
        confirmPhrase: "cancelar",
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
        toast.error(
          err instanceof Error ? err.message : "Falha ao atualizar status.",
        );
      }
    }
  }

  async function revertToDraft() {
    if (!selectedPost) return;
    beginBusy(
      "revert_to_draft",
      selectedPost.status === "scheduled"
        ? "Removendo do calendário…"
        : "Restaurando como rascunho…",
    );
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
      endBusy();
    }
  }

  async function savePost(schedule: boolean) {
    beginBusy(
      schedule ? "schedule" : selectedPost?.status === "scheduled" ? "save_scheduled" : "save_draft",
      schedule ? "Agendando postagem…" : "Salvando…",
    );
    try {
      let postId = selectedPost?.id;

      if (!postId) {
        setOperationStatus("Criando postagem…");
        const created = await createPost(buildCreatePostBody());
        postId = created.id;
      }

      if (files && files.length > 0) {
        setOperationStatus(
          `Enviando mídias (0/${files.length})…`,
        );
        let sortOrder = (await listAssets(postId)).length + 1;
        let index = 0;
        for (const file of [...files]) {
          index += 1;
          setOperationStatus(`Enviando mídias (${index}/${files.length})…`);
          await uploadAsset(postId, file, sortOrder);
          sortOrder += 1;
        }
      }

      if (schedule) {
        if (!meta?.connected)
          throw new Error("Conecte Instagram antes de agendar.");
        const scheduledIso = toIsoFromDatetimeLocal(scheduledAt, timezone);
        if (!scheduledIso) throw new Error("Informe data e hora para agendar.");
        setOperationStatus("Confirmando agendamento…");
        await updatePost(postId, {
          caption,
          collaborators: parseCollaboratorsInput(collaboratorsText),
          reply_mode: replyMode,
          status: "scheduled",
          scheduled_at: scheduledIso,
        });
        toast.success("Postagem agendada.");
      } else {
        const updateBody: Record<string, unknown> = {
          caption,
          collaborators: parseCollaboratorsInput(collaboratorsText),
          reply_mode: replyMode,
        };
        const isDraftSave = !selectedPost || selectedPost.status === "draft";
        if (!scheduledAt.trim() && isDraftSave) {
          updateBody.scheduled_at = null;
        }
        setOperationStatus("Salvando alterações…");
        await updatePost(postId, updateBody);
        toast.success(
          selectedPost?.status === "scheduled"
            ? "Alterações salvas."
            : "Rascunho salvo.",
        );
      }

      await loadPosts();
      const post = await fetchPost(postId);
      setSelectedPost(post);
      setScheduledAt(toDatetimeLocalFromIso(post.scheduled_at, timezone));
      loadEditorialFieldsFromPost(post);
      setDialogMode("edit");
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    } finally {
      endBusy();
    }
  }

  async function publishNow() {
    const bypassSchedule = selectedPost?.status === "scheduled";
    const ok = await confirm({
      title: "Publicar agora no Instagram?",
      description: bypassSchedule
        ? "A postagem sai imediatamente, sem aguardar o horário agendado. Isso não pode ser desfeito pelo Iris."
        : "A postagem será publicada na sua conta do Instagram imediatamente. Isso não pode ser desfeito pelo Iris.",
      confirmLabel: "Publicar agora",
      confirmPhrase: "publicar",
    });
    if (!ok) return;

    beginBusy("publish_now", "Preparando publicação…");
    let postId = selectedPost?.id;
    try {
      if (!meta?.connected) {
        throw new Error("Conecte Instagram antes de publicar.");
      }

      if (!postId) {
        setOperationStatus("Criando postagem…");
        const created = await createPost(buildCreatePostBody());
        postId = created.id;
      }

      if (files && files.length > 0) {
        let sortOrder = (await listAssets(postId)).length + 1;
        let index = 0;
        for (const file of [...files]) {
          index += 1;
          setOperationStatus(`Enviando mídias (${index}/${files.length})…`);
          await uploadAsset(postId, file, sortOrder);
          sortOrder += 1;
        }
      }

      setOperationStatus("Salvando legenda e configurações…");
      await updatePost(postId, {
        caption,
        collaborators: parseCollaboratorsInput(collaboratorsText),
        reply_mode: replyMode,
      });

      const assets = await listAssets(postId);
      if (assets.length < 1) {
        throw new Error("Adicione pelo menos uma mídia antes de publicar.");
      }

      setOperationStatus(
        assets.length > 1
          ? `Publicando carrossel (${assets.length} imagens) no Instagram… A Meta processa cada slide — pode levar um minuto.`
          : "Publicando no Instagram… A Meta processa a imagem — pode levar alguns segundos.",
      );
      const post = await publishPostNow(postId);
      await loadPosts();
      setSelectedPost(post);
      setScheduledAt(toDatetimeLocalFromIso(post.scheduled_at, timezone));
      loadEditorialFieldsFromPost(post);
      setDialogMode("edit");
      setFiles(null);
      toast.success("Postagem publicada no Instagram.");
    } catch (err) {
      if (!handleAuthError(err)) {
        const message =
          err instanceof Error ? err.message : "Falha ao publicar.";
        setError(message);
        toast.error(message);
        if (postId) {
          try {
            const refreshed = await fetchPost(postId);
            setSelectedPost(refreshed);
            await loadPosts();
          } catch {
            // ignore refresh errors after failed publish
          }
        }
      }
    } finally {
      endBusy();
    }
  }
  async function deleteSelectedPost() {
    if (!selectedPost) return;

    if (selectedPost.status === "cancelled") {
      const ok = await confirm({
        title: "Deletar permanentemente?",
        description:
          "A postagem e as mídias saem do banco de dados. Esta ação não pode ser desfeita.",
        confirmLabel: "Deletar permanentemente",
        confirmPhrase: "deletar",
        variant: "destructive",
      });
      if (!ok) return;

      beginBusy("delete", "Removendo permanentemente…");
      try {
        await purgeCancelledPost(selectedPost.id);
        await loadPosts();
        toast.success("Postagem removida do banco.");
        closeDialog();
      } catch (err) {
        if (!handleAuthError(err)) {
          setError(
            err instanceof Error ? err.message : "Falha ao deletar permanentemente.",
          );
        }
      } finally {
        endBusy();
      }
      return;
    }

    const ok = await confirm({
      title: "Deletar postagem?",
      description:
        "A postagem sai do fluxo editorial ativo (status cancelado). Você poderá restaurá-la como rascunho depois.",
      confirmLabel: "Deletar",
      confirmPhrase: "deletar",
      variant: "destructive",
    });
    if (!ok) return;

    beginBusy("delete", "Cancelando postagem…");
    try {
      await deletePost(selectedPost.id);
      await loadPosts();
      toast.success("Postagem deletada.");
      closeDialog();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err instanceof Error ? err.message : "Falha ao deletar.");
      }
    } finally {
      endBusy();
    }
  }

  async function purgePost(post: Post) {
    const ok = await confirm({
      title: "Deletar permanentemente?",
      description:
        "A postagem e as mídias saem do banco de dados. Esta ação não pode ser desfeita.",
      confirmLabel: "Deletar permanentemente",
      confirmPhrase: "deletar",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await purgeCancelledPost(post.id);
      await loadPosts();
      if (selectedPost?.id === post.id) {
        closeDialog();
      }
      toast.success("Postagem removida do banco.");
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Falha ao deletar permanentemente.",
        );
      }
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
            className="h-11 shrink-0 sm:px-6"
          >
            <Plus className="mr-2 size-4" />
            Nova postagem
          </Button>
        </header>
      )}

      <PageContainer variant="fill" className="px-8 pb-8">
        {view === "kanban" ? (
          <KanbanBoard
            posts={posts}
            timeZone={timezone}
            globalReplyMode={globalReplyMode}
            onOpenPost={openPost}
            onStatusChange={(post, status) => void changeStatus(post, status)}
            onPurgePost={(post) => void purgePost(post)}
          />
        ) : view === "list" ? (
          <CalendarListView
            posts={posts}
            cursor={cursor}
            selectedId={selectedPost?.id ?? null}
            timeZone={timezone}
            globalReplyMode={globalReplyMode}
            onCursorChange={setCursor}
            onSelect={openPost}
            onCreatePost={openCreate}
          />
        ) : (
          <CalendarView
            posts={posts}
            cursor={cursor}
            selectedId={selectedPost?.id ?? null}
            timeZone={timezone}
            globalReplyMode={globalReplyMode}
            onCursorChange={setCursor}
            onSelect={openPost}
            onCreatePost={openCreate}
          />
        )}
      </PageContainer>

      <PostDialog
        open={dialogOpen}
        mode={dialogMode}
        post={selectedPost}
        metaConnected={Boolean(meta?.connected)}
        metaIgUsername={meta?.igUsername}
        timeZone={timezone}
        saving={saving}
        busyAction={busyAction}
        operationStatus={operationStatus}
        error={error}
        caption={caption}
        collaboratorsText={collaboratorsText}
        scheduledAt={scheduledAt}
        replyMode={replyMode}
        carouselSummary={carouselSummary}
        replyPrompt={replyPrompt}
        silenceSoul={silenceSoul}
        silencePage={silencePage}
        silenceKnowledge={silenceKnowledge}
        silenceRestrictions={silenceRestrictions}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
        onCaptionChange={setCaption}
        onCollaboratorsTextChange={setCollaboratorsText}
        onScheduledAtChange={setScheduledAt}
        onReplyModeChange={setReplyMode}
        onCarouselSummaryChange={setCarouselSummary}
        onReplyPromptChange={setReplyPrompt}
        onSilenceSoulChange={setSilenceSoul}
        onSilencePageChange={setSilencePage}
        onSilenceKnowledgeChange={setSilenceKnowledge}
        onSilenceRestrictionsChange={setSilenceRestrictions}
        onFilesChange={(nextFiles) => {
          if (!nextFiles) {
            setFiles(null);
            return;
          }
          setFiles((previous) => {
            const transfer = new DataTransfer();
            if (previous) {
              for (const file of previous) {
                transfer.items.add(file);
              }
            }
            for (const file of nextFiles) {
              transfer.items.add(file);
            }
            return transfer.files;
          });
        }}
        onFilesReplace={setFiles}
        onSaveDraft={() => void savePost(false)}
        onSchedule={() => void savePost(true)}
        onPublishNow={() => void publishNow()}
        onDelete={
          selectedPost &&
          selectedPost.status !== "published" &&
          selectedPost.status !== "monitored"
            ? () => void deleteSelectedPost()
            : undefined
        }
        onRevertToDraft={
          selectedPost?.status === "scheduled" ||
          selectedPost?.status === "cancelled"
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
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Falha ao atualizar.",
                      );
                    }
                  });
              }
            : undefined
        }
        onRetrySchedule={
          selectedPost?.status === "failed"
            ? () => void savePost(true)
            : undefined
        }
      />
    </>
  );
}
