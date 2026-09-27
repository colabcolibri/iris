import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CalendarListView } from "@/components/calendar/calendar-list-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PipelineDateFilterMenu } from "@/components/kanban/pipeline-date-filter-menu";
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
import { usePipelineDateFilter } from "@/hooks/use-pipeline-date-filter";
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
import { filterPostsByPipelineDate } from "@iris/domain/posts/pipeline-date-filter";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { parseAgentActiveDaysInput } from "@/lib/parse-agent-active-days";

export function DashboardPage() {
  const { locale } = useAppLocale();
  const postsMsg = useDomainMessages("posts");
  const { timezone, replyMode: globalReplyMode } = useAppSettings();
  const { meta } = useMetaSession();
  const { view } = useDashboardView();
  const { filter: pipelineDateFilter, setFilter: setPipelineDateFilter, label: pipelineDateLabel } =
    usePipelineDateFilter(timezone);
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
  const [privateReplyMode, setPrivateReplyMode] =
    useState<PostReplyModeSetting>("inherit");
  const [agentActiveDays, setAgentActiveDays] = useState("");
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
      if (!handleAuthError(err)) toast.error(postsMsg.toasts.loadFailed);
    });
  }, [loadPosts, handleAuthError, postsMsg.toasts.loadFailed]);

  const kanbanPosts = useMemo(
    () =>
      filterPostsByPipelineDate(posts, pipelineDateFilter, timezone),
    [posts, pipelineDateFilter, timezone],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_connected") === "1")
      toast.success(postsMsg.page.meta.connectedSuccess);
    if (params.get("meta_error")) toast.error(postsMsg.page.meta.connectFailed);
    if (params.has("meta_connected") || params.has("meta_error")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [postsMsg.page.meta.connectedSuccess, postsMsg.page.meta.connectFailed]);

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
    setAgentActiveDays("");
    setPrivateReplyMode("inherit");
  }

  function loadEditorialFieldsFromPost(post: Post) {
    setCollaboratorsText(formatCollaborators(post.collaborators));
    setCarouselSummary(post.carousel_summary ?? "");
    setReplyPrompt(post.reply_prompt ?? "");
    setSilenceSoul(post.silence_soul ?? false);
    setSilencePage(post.silence_page ?? false);
    setSilenceKnowledge(post.silence_knowledge ?? false);
    setSilenceRestrictions(post.silence_restrictions ?? false);
    setAgentActiveDays(
      post.agent_active_days != null ? String(post.agent_active_days) : "",
    );
    setPrivateReplyMode(post.private_reply_mode ?? "inherit");
  }

  function campaignFieldsForPost() {
    return {
      agent_active_days: parseAgentActiveDaysInput(agentActiveDays),
      private_reply_mode: privateReplyMode,
    };
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
      ...campaignFieldsForPost(),
    };
  }

  function openCreate() {
    setSelectedPost(null);
    setDialogMode("create");
    setCaption("");
    setCollaboratorsText("");
    setScheduledAt("");
    setReplyMode("inherit");
    setPrivateReplyMode("inherit");
    setAgentActiveDays("");
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
    setPrivateReplyMode(post.private_reply_mode ?? "inherit");
    setAgentActiveDays(
      post.agent_active_days != null ? String(post.agent_active_days) : "",
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
        title: postsMsg.confirm.cancelPost.title,
        description: postsMsg.confirm.cancelPost.description,
        confirmLabel: postsMsg.confirm.cancelPost.confirmLabel,
        confirmPhrase: postsMsg.confirm.cancelPost.confirmPhrase,
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
          ? postsMsg.toasts.cancelled
          : status === "draft" && post.status === "scheduled"
            ? postsMsg.toasts.unscheduled
            : status === "draft"
              ? postsMsg.toasts.backToDraft
              : postsMsg.toasts.statusUpdated;
      toast.success(message);
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error(
          getApiErrorMessage(err, locale) || postsMsg.toasts.updateStatusFailed,
        );
      }
    }
  }

  async function revertToDraft() {
    if (!selectedPost) return;
    beginBusy(
      "revert_to_draft",
      selectedPost.status === "scheduled"
        ? postsMsg.operations.revertingScheduled
        : postsMsg.operations.revertingDraft,
    );
    try {
      await updatePost(selectedPost.id, { status: "draft" });
      await loadPosts();
      const updated = await fetchPost(selectedPost.id);
      setSelectedPost(updated);
      toast.success(
        selectedPost.status === "scheduled"
          ? postsMsg.toasts.unscheduled
          : postsMsg.toasts.restoredDraft,
      );
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(getApiErrorMessage(err, locale) || postsMsg.toasts.updateFailed);
      }
    } finally {
      endBusy();
    }
  }

  async function savePost(schedule: boolean) {
    beginBusy(
      schedule ? "schedule" : selectedPost?.status === "scheduled" ? "save_scheduled" : "save_draft",
      schedule ? postsMsg.operations.scheduling : postsMsg.operations.saving,
    );
    try {
      let postId = selectedPost?.id;

      if (!postId) {
        setOperationStatus(postsMsg.operations.creating);
        const created = await createPost(buildCreatePostBody());
        postId = created.id;
      }

      if (files && files.length > 0) {
        setOperationStatus(
          interpolate(postsMsg.media.uploading, { current: 0, total: files.length }),
        );
        let sortOrder = (await listAssets(postId)).length + 1;
        let index = 0;
        for (const file of [...files]) {
          index += 1;
          setOperationStatus(
            interpolate(postsMsg.media.uploading, {
              current: index,
              total: files.length,
            }),
          );
          await uploadAsset(postId, file, sortOrder);
          sortOrder += 1;
        }
      }

      if (schedule) {
        if (!meta?.connected)
          throw new Error(postsMsg.errors.connectBeforeSchedule);
        const scheduledIso = toIsoFromDatetimeLocal(scheduledAt, timezone);
        if (!scheduledIso) throw new Error(postsMsg.errors.scheduleDateRequired);
        setOperationStatus(postsMsg.operations.confirmingSchedule);
        await updatePost(postId, {
          caption,
          collaborators: parseCollaboratorsInput(collaboratorsText),
          reply_mode: replyMode,
          ...campaignFieldsForPost(),
          status: "scheduled",
          scheduled_at: scheduledIso,
        });
        toast.success(postsMsg.toasts.scheduled);
      } else {
        const updateBody: Record<string, unknown> = {
          caption,
          collaborators: parseCollaboratorsInput(collaboratorsText),
          reply_mode: replyMode,
          ...campaignFieldsForPost(),
        };
        const isDraftSave = !selectedPost || selectedPost.status === "draft";
        if (!scheduledAt.trim() && isDraftSave) {
          updateBody.scheduled_at = null;
        }
        setOperationStatus(postsMsg.operations.savingChanges);
        await updatePost(postId, updateBody);
        toast.success(
          selectedPost?.status === "scheduled"
            ? postsMsg.toasts.changesSaved
            : postsMsg.toasts.draftSaved,
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
        setError(getApiErrorMessage(err, locale) || postsMsg.toasts.saveFailed);
      }
    } finally {
      endBusy();
    }
  }

  async function publishNow() {
    const bypassSchedule = selectedPost?.status === "scheduled";
    const ok = await confirm({
      title: postsMsg.confirm.publishNow.title,
      description: bypassSchedule
        ? postsMsg.confirm.publishNow.descriptionScheduled
        : postsMsg.confirm.publishNow.descriptionDraft,
      confirmLabel: postsMsg.confirm.publishNow.confirmLabel,
      confirmPhrase: postsMsg.confirm.publishNow.confirmPhrase,
    });
    if (!ok) return;

    beginBusy("publish_now", postsMsg.operations.preparingPublish);
    let postId = selectedPost?.id;
    try {
      if (!meta?.connected) {
        throw new Error(postsMsg.errors.connectBeforePublish);
      }

      if (!postId) {
        setOperationStatus(postsMsg.operations.creating);
        const created = await createPost(buildCreatePostBody());
        postId = created.id;
      }

      if (files && files.length > 0) {
        let sortOrder = (await listAssets(postId)).length + 1;
        let index = 0;
        for (const file of [...files]) {
          index += 1;
          setOperationStatus(
            interpolate(postsMsg.media.uploading, {
              current: index,
              total: files.length,
            }),
          );
          await uploadAsset(postId, file, sortOrder);
          sortOrder += 1;
        }
      }

      setOperationStatus(postsMsg.operations.savingCaption);
      await updatePost(postId, {
        caption,
        collaborators: parseCollaboratorsInput(collaboratorsText),
        reply_mode: replyMode,
      });

      const assets = await listAssets(postId);
      if (assets.length < 1) {
        throw new Error(postsMsg.errors.mediaRequired);
      }

      setOperationStatus(
        assets.length > 1
          ? interpolate(postsMsg.operations.publishingCarousel, {
              count: assets.length,
            })
          : postsMsg.operations.publishingSingle,
      );
      const post = await publishPostNow(postId);
      await loadPosts();
      setSelectedPost(post);
      setScheduledAt(toDatetimeLocalFromIso(post.scheduled_at, timezone));
      loadEditorialFieldsFromPost(post);
      setDialogMode("edit");
      setFiles(null);
      toast.success(postsMsg.toasts.published);
    } catch (err) {
      if (!handleAuthError(err)) {
        const message =
          getApiErrorMessage(err, locale) || postsMsg.toasts.publishFailed;
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
        title: postsMsg.confirm.purgePost.title,
        description: postsMsg.confirm.purgePost.description,
        confirmLabel: postsMsg.confirm.purgePost.confirmLabel,
        confirmPhrase: postsMsg.confirm.purgePost.confirmPhrase,
        variant: "destructive",
      });
      if (!ok) return;

      beginBusy("delete", postsMsg.operations.purging);
      try {
        await purgeCancelledPost(selectedPost.id);
        await loadPosts();
        toast.success(postsMsg.toasts.purged);
        closeDialog();
      } catch (err) {
        if (!handleAuthError(err)) {
          setError(
            getApiErrorMessage(err, locale) || postsMsg.toasts.purgeFailed,
          );
        }
      } finally {
        endBusy();
      }
      return;
    }

    const ok = await confirm({
      title: postsMsg.confirm.deletePost.title,
      description: postsMsg.confirm.deletePost.description,
      confirmLabel: postsMsg.confirm.deletePost.confirmLabel,
      confirmPhrase: postsMsg.confirm.deletePost.confirmPhrase,
      variant: "destructive",
    });
    if (!ok) return;

    beginBusy("delete", postsMsg.operations.deleting);
    try {
      await deletePost(selectedPost.id);
      await loadPosts();
      toast.success(postsMsg.toasts.deleted);
      closeDialog();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(getApiErrorMessage(err, locale) || postsMsg.toasts.deleteFailed);
      }
    } finally {
      endBusy();
    }
  }

  async function purgePost(post: Post) {
    const ok = await confirm({
      title: postsMsg.confirm.purgePost.title,
      description: postsMsg.confirm.purgePost.description,
      confirmLabel: postsMsg.confirm.purgePost.confirmLabel,
      confirmPhrase: postsMsg.confirm.purgePost.confirmPhrase,
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await purgeCancelledPost(post.id);
      await loadPosts();
      if (selectedPost?.id === post.id) {
        closeDialog();
      }
      toast.success(postsMsg.toasts.purged);
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error(
          getApiErrorMessage(err, locale) || postsMsg.toasts.purgeFailed,
        );
      }
    }
  }

  return (
    <>
      {view === "kanban" && (
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 px-8 pt-8 pb-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {postsMsg.page.kanban.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {postsMsg.page.kanban.description}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <PipelineDateFilterMenu
              filter={pipelineDateFilter}
              label={pipelineDateLabel}
              onChange={setPipelineDateFilter}
              className="min-w-0 flex-1 sm:flex-none"
            />
            <Button
              type="button"
              size="sm"
              onClick={openCreate}
              className="h-11 shrink-0 sm:px-6"
            >
              <Plus className="mr-2 size-4" />
              {postsMsg.page.kanban.newPost}
            </Button>
          </div>
        </header>
      )}

      <PageContainer variant="fill" className="px-8 pb-8">
        {view === "kanban" ? (
          <KanbanBoard
            posts={kanbanPosts}
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
        privateReplyMode={privateReplyMode}
        agentActiveDays={agentActiveDays}
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
        onPrivateReplyModeChange={setPrivateReplyMode}
        onAgentActiveDaysChange={setAgentActiveDays}
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
                    toast.success(postsMsg.toasts.backToDraft);
                    return loadPosts();
                  })
                  .catch((err) => {
                    if (!handleAuthError(err)) {
                      setError(
                        getApiErrorMessage(err, locale) ||
                          postsMsg.toasts.updateFailed,
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
