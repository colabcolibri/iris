import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppRoutes } from "@/demo/demo-routes";
import { CarouselSummaryEditor } from "@/components/comments/carousel-summary-editor";
import { CommentThread } from "@/components/comments/comment-thread";
import { StatusBadge } from "@/components/posts/status-badge";
import { PostMediaSection } from "@/components/posts/post-media-section";
import { PostReplyStatusBadge } from "@/components/posts/post-reply-status-badge";
import { UsernamePillsField } from "@/components/posts/username-pills-field";
import {
  getPostDialogFooterActions,
  type PostDialogFooterActionId,
} from "@/components/posts/post-dialog-footer-actions";
import { AppDialog } from "@/components/templates/app-dialog";
import { AppAccordion } from "@/components/templates/app-accordion";
import { PostReplyBriefingEditor } from "@/components/posts/post-reply-briefing-editor";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppSettings } from "@/contexts/app-settings-context";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  replyStatusPresentation,
  resolveEffectivePostReplyStatus,
} from "@iris/domain/reply-effective-status";
import { resolveAgentActiveDaysRemaining } from "@iris/domain/posts/post-agent-active";
import type { Post as DomainPost } from "@iris/domain/posts/post";
import { buildCommentThreadGroups } from "@/lib/build-comment-tree";
import {
  approveCommentReply,
  fetchComments,
  removeCommentDraft,
  requestCommentAiReply,
  updateCommentDraft,
} from "@/lib/api";
import type { Comment, Post, PostReplyModeSetting } from "@/lib/types";

export type PostDialogMode = "create" | "edit";

type PostDialogProps = {
  open: boolean;
  mode: PostDialogMode | null;
  post: Post | null;
  metaConnected: boolean;
  metaIgUsername?: string | null;
  timeZone: string;
  saving: boolean;
  /** Qual ação do rodapé está em andamento — só esse botão mostra spinner. */
  busyAction?: PostDialogFooterActionId | null;
  /** Texto de progresso (ex.: etapas do publish). */
  operationStatus?: string | null;
  error: string;
  caption: string;
  collaboratorsText: string;
  scheduledAt: string;
  replyMode: PostReplyModeSetting;
  privateReplyMode: PostReplyModeSetting;
  agentActiveDays: string;
  carouselSummary: string;
  replyPrompt: string;
  silenceSoul: boolean;
  silencePage: boolean;
  silenceKnowledge: boolean;
  silenceRestrictions: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptionChange: (value: string) => void;
  onCollaboratorsTextChange: (value: string) => void;
  onScheduledAtChange: (value: string) => void;
  onReplyModeChange: (value: PostReplyModeSetting) => void;
  onPrivateReplyModeChange: (value: PostReplyModeSetting) => void;
  onAgentActiveDaysChange: (value: string) => void;
  onCarouselSummaryChange: (value: string) => void;
  onReplyPromptChange: (value: string) => void;
  onSilenceSoulChange: (value: boolean) => void;
  onSilencePageChange: (value: boolean) => void;
  onSilenceKnowledgeChange: (value: boolean) => void;
  onSilenceRestrictionsChange: (value: boolean) => void;
  onFilesChange: (files: FileList | null) => void;
  onFilesReplace: (files: FileList | null) => void;
  onSaveDraft: () => void;
  onSchedule: () => void;
  onPublishNow?: () => void;
  onDelete?: () => void;
  onRevertToDraft?: () => void;
  onRetryDraft?: () => void;
  onRetrySchedule?: () => void;
};

export function PostDialog({
  open,
  mode,
  post,
  metaConnected,
  metaIgUsername,
  timeZone,
  saving,
  busyAction = null,
  operationStatus = null,
  error,
  caption,
  collaboratorsText,
  scheduledAt,
  replyMode,
  privateReplyMode,
  agentActiveDays,
  carouselSummary,
  replyPrompt,
  silenceSoul,
  silencePage,
  silenceKnowledge,
  silenceRestrictions,
  onOpenChange,
  onCaptionChange,
  onCollaboratorsTextChange,
  onScheduledAtChange,
  onReplyModeChange,
  onPrivateReplyModeChange,
  onAgentActiveDaysChange,
  onCarouselSummaryChange,
  onReplyPromptChange,
  onSilenceSoulChange,
  onSilencePageChange,
  onSilenceKnowledgeChange,
  onSilenceRestrictionsChange,
  onFilesChange,
  onFilesReplace,
  onSaveDraft,
  onSchedule,
  onPublishNow,
  onDelete,
  onRevertToDraft,
  onRetryDraft,
  onRetrySchedule,
}: PostDialogProps) {
  const { locale } = useAppLocale();
  const postsMsg = useDomainMessages("posts");
  const { replyMode: globalReplyMode } = useAppSettings();
  const routes = useAppRoutes();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [removingDraftId, setRemovingDraftId] = useState<string | null>(null);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(["content"]);
  const [contentTab, setContentTab] = useState("caption");

  const reloadComments = useCallback(async (postId: string) => {
    const next = await fetchComments(postId);
    setComments(next);
    return next;
  }, []);

  useEffect(() => {
    if (open) {
      setOpenSections(["content"]);
      setContentTab("caption");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !post?.id || mode !== "edit") {
      setComments([]);
      return;
    }

    let cancelled = false;
    setLoadingComments(true);
    void reloadComments(post.id)
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(err, locale) || postsMsg.toasts.commentsLoadFailed,
          );
          setComments([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingComments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, post?.id, mode, reloadComments]);

  const threadGroups = useMemo(
    () => buildCommentThreadGroups(comments),
    [comments],
  );

  const replaceComment = useCallback((updated: Comment) => {
    setComments((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const handleApproveDraft = useCallback(
    async (commentId: string, draftText?: string | null) => {
      setApprovingId(commentId);
      try {
        const updated = await approveCommentReply(
          commentId,
          draftText ?? undefined,
        );
        replaceComment(updated);
        toast.success(postsMsg.toasts.replyPublished);
        if (post?.id) {
          await reloadComments(post.id);
        }
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, locale) || postsMsg.toasts.approveFailed,
        );
      } finally {
        setApprovingId(null);
      }
    },
    [post?.id, reloadComments, replaceComment, locale, postsMsg],
  );

  const handleRemoveDraft = useCallback(
    async (commentId: string) => {
      setRemovingDraftId(commentId);
      try {
        const updated = await removeCommentDraft(commentId);
        replaceComment(updated);
        toast.success(postsMsg.toasts.draftRemoved);
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, locale) || postsMsg.toasts.removeDraftFailed,
        );
      } finally {
        setRemovingDraftId(null);
      }
    },
    [replaceComment, locale, postsMsg],
  );

  const handleSaveDraft = useCallback(
    async (commentId: string, draftText: string) => {
      setSavingDraftId(commentId);
      try {
        const updated = await updateCommentDraft(commentId, draftText);
        replaceComment(updated);
        toast.success(postsMsg.toasts.draftSavedComment);
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, locale) || postsMsg.toasts.saveDraftFailed,
        );
        throw err;
      } finally {
        setSavingDraftId(null);
      }
    },
    [replaceComment, locale, postsMsg],
  );

  const handleGenerateDraft = useCallback(
    async (commentId: string) => {
      setGeneratingId(commentId);
      try {
        const updated = await requestCommentAiReply(commentId, "draft");
        replaceComment(updated);
        toast.success(postsMsg.toasts.draftGenerated);
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, locale) || postsMsg.toasts.generateDraftFailed,
        );
      } finally {
        setGeneratingId(null);
      }
    },
    [replaceComment, locale, postsMsg],
  );

  if (!mode) return null;

  const title =
    mode === "create" ? postsMsg.dialog.createTitle : postsMsg.dialog.editTitle;
  const status = post?.status;
  const isReadOnly = status === "published" || status === "monitored";
  const isScheduled = status === "scheduled";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";
  const isDraft = !status || status === "draft";
  const canPublishNow =
    Boolean(onPublishNow) &&
    !isReadOnly &&
    !isCancelled &&
    (isDraft || isScheduled || isFailed || mode === "create");
  const footerActions = getPostDialogFooterActions({
    status,
    mode,
    hasSchedule: Boolean(scheduledAt.trim()),
    metaConnected,
    canPublishNow,
    canRevertToDraft: Boolean(onRevertToDraft) && (isScheduled || isCancelled),
    canRetryDraft: Boolean(onRetryDraft) && isFailed,
    canRetrySchedule: Boolean(onRetrySchedule) && isFailed,
    canDelete:
      Boolean(onDelete) &&
      mode === "edit" &&
      Boolean(post?.id) &&
      !isReadOnly,
    labels: postsMsg.footer,
  });
  const footerHandlers: Partial<Record<PostDialogFooterActionId, () => void>> =
    {
      delete: onDelete,
      publish_now: onPublishNow,
      schedule: onSchedule,
      save_draft: onSaveDraft,
      save_scheduled: onSchedule,
      revert_to_draft: onRevertToDraft,
      retry_draft: onRetryDraft,
      retry_schedule: onRetrySchedule,
    };
  const effectiveReply = resolveEffectivePostReplyStatus(
    globalReplyMode,
    replyMode,
  );
  const effectiveReplyCopy = replyStatusPresentation(effectiveReply);

  const agentActiveCampaignHint = useMemo(() => {
    if (
      !post ||
      (post.status !== "published" && post.status !== "monitored") ||
      !post.published_at
    ) {
      return null;
    }

    const daysFromInput = agentActiveDays.trim()
      ? Number(agentActiveDays)
      : null;
    const agentActiveDaysValue =
      post.agent_active_days ?? (Number.isFinite(daysFromInput) ? daysFromInput : null);

    if (agentActiveDaysValue == null || agentActiveDaysValue <= 0) {
      return null;
    }

    const domainPost = {
      agentActiveDays: agentActiveDaysValue,
      publishedAt: post.published_at,
      createdAt: post.created_at,
    } as DomainPost;

    const remaining = resolveAgentActiveDaysRemaining(domainPost);
    if (remaining === null) {
      return null;
    }
    if (remaining === 0) {
      return postsMsg.dialog.fields.agentActiveDaysExpired;
    }
    return interpolate(postsMsg.dialog.fields.agentActiveDaysRemaining, {
      count: remaining,
    });
  }, [post, agentActiveDays, postsMsg]);

  const statusHint = (() => {
    if (mode === "create") {
      return postsMsg.dialog.statusHints.create;
    }
    switch (status) {
      case "draft":
        return postsMsg.dialog.statusHints.draft;
      case "scheduled":
        return postsMsg.dialog.statusHints.scheduled;
      case "published":
        return postsMsg.dialog.statusHints.published;
      case "failed":
        return postsMsg.dialog.statusHints.failed;
      case "cancelled":
        return postsMsg.dialog.statusHints.cancelled;
      default:
        return null;
    }
  })();

  const showCommentsSection =
    mode === "edit" &&
    post?.id &&
    (status === "published" ||
      status === "monitored" ||
      loadingComments ||
      comments.length > 0);

  const isPendingCreate = mode === "create" || !post?.id;

  const statusBadge =
    mode === "create" || !post ? (
      <StatusBadge status="draft" variant="signal" className="pl-5" />
    ) : (
      <StatusBadge status={post.status} variant="signal" className="pl-5" />
    );

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} size="xl" height="full">
      <AppDialog.Header title={title} description={statusHint} />

      <AppDialog.Body>
        {isFailed && post?.error_message ? (
          <p className="mb-4 rounded-(--iris-radius-sm) border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {interpolate(postsMsg.dialog.failureCause, {
              message: post.error_message,
            })}
          </p>
        ) : null}

        <AppAccordion
          multiple
          value={openSections}
          onValueChange={setOpenSections}
        >
          <AppAccordion.Item value="content">
            <AppAccordion.Trigger>
              {postsMsg.dialog.sections.content}
            </AppAccordion.Trigger>
            <AppAccordion.Content className="space-y-8">
              {status === "published" && post?.ig_media_id ? (
                <p className="text-xs text-muted-foreground">
                  {postsMsg.dialog.metaId}{" "}
                  <span className="font-mono text-foreground/80">
                    {post.ig_media_id}
                  </span>
                  {metaIgUsername ? (
                    <>
                      {" · "}
                      <a
                        href={`https://www.instagram.com/${metaIgUsername}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {postsMsg.dialog.openProfile}
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}

              <Tabs
                value={contentTab}
                onValueChange={setContentTab}
                className="w-full min-w-0"
              >
                <TabsList
                  variant="line"
                  className="mb-4 h-auto min-h-8 w-full max-w-full flex-wrap justify-start gap-x-1 overflow-x-auto overflow-y-hidden pb-1.5"
                >
                  <TabsTrigger value="caption" className="shrink-0">
                    {postsMsg.dialog.tabs.caption}
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="shrink-0">
                    {postsMsg.dialog.tabs.summary}
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="shrink-0">
                    {postsMsg.dialog.tabs.additionalPrompt}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="caption" className="min-w-0 space-y-4">
                  <Textarea
                    id="post-caption"
                    value={caption}
                    onChange={(e) => onCaptionChange(e.target.value)}
                    rows={8}
                    className="min-h-40 w-full resize-y bg-background"
                    placeholder={postsMsg.dialog.fields.captionPlaceholder}
                    required
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="post-collaborators">
                      {postsMsg.dialog.fields.collaborators}
                    </Label>
                    <UsernamePillsField
                      id="post-collaborators"
                      values={collaboratorsText
                        .split(",")
                        .map((part) => part.trim().replace(/^@+/, ""))
                        .filter(Boolean)}
                      onChange={(next: string[]) =>
                        onCollaboratorsTextChange(next.join(", "))
                      }
                      max={3}
                      disabled={isReadOnly}
                      placeholder={postsMsg.dialog.fields.collaboratorsPlaceholder}
                    />
                    <p className="text-xs text-muted-foreground">
                      {postsMsg.dialog.fields.collaboratorsHint}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="min-w-0">
                  {isPendingCreate ? (
                    <CarouselSummaryEditor
                      embedded
                      summary={carouselSummary}
                      onSummaryChange={onCarouselSummaryChange}
                    />
                  ) : (
                    <CarouselSummaryEditor
                      embedded
                      postId={post!.id}
                      initialSummary={post!.carousel_summary}
                    />
                  )}
                </TabsContent>

                <TabsContent value="prompt" className="min-w-0">
                  {isPendingCreate ? (
                    <PostReplyBriefingEditor
                      embedded
                      replyPrompt={replyPrompt}
                      onReplyPromptChange={onReplyPromptChange}
                      silenceSoul={silenceSoul}
                      onSilenceSoulChange={onSilenceSoulChange}
                      silencePage={silencePage}
                      onSilencePageChange={onSilencePageChange}
                      silenceKnowledge={silenceKnowledge}
                      onSilenceKnowledgeChange={onSilenceKnowledgeChange}
                      silenceRestrictions={silenceRestrictions}
                      onSilenceRestrictionsChange={onSilenceRestrictionsChange}
                    />
                  ) : (
                    <PostReplyBriefingEditor
                      embedded
                      postId={post!.id}
                      initialReplyPrompt={post!.reply_prompt}
                      initialSilenceSoul={post!.silence_soul}
                      initialSilencePage={post!.silence_page}
                      initialSilenceKnowledge={post!.silence_knowledge}
                      initialSilenceRestrictions={post!.silence_restrictions}
                    />
                  )}
                </TabsContent>
              </Tabs>

              <PostMediaSection
                postId={post?.id}
                readOnly={isReadOnly}
                refreshKey={post?.updated_at}
                mode={mode}
                onFilesChange={onFilesChange}
                onFilesReplace={onFilesReplace}
              />
            </AppAccordion.Content>
          </AppAccordion.Item>

          <AppAccordion.Item value="replies">
            <AppAccordion.Trigger>
              <span className="flex items-center gap-2">
                <span>{postsMsg.dialog.sections.aiReply}</span>
                {showCommentsSection && comments.length > 0 ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {comments.length === 1
                      ? interpolate(postsMsg.dialog.comments.countOne, {
                          count: comments.length,
                        })
                      : interpolate(postsMsg.dialog.comments.countOther, {
                          count: comments.length,
                        })}
                  </span>
                ) : null}
              </span>
            </AppAccordion.Trigger>
            <AppAccordion.Content className="w-full max-w-full min-w-0 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {postsMsg.dialog.fields.replyModeTitle}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {postsMsg.dialog.fields.replyModeHint}
                  </p>
                </div>
                <PostReplyStatusBadge
                  post={{ reply_mode: replyMode }}
                  globalReplyMode={globalReplyMode}
                  size="md"
                />
              </div>

              <div className="w-full max-w-full min-w-0 space-y-2">
                <Label
                  htmlFor="post-reply-mode"
                  className="text-sm font-semibold"
                >
                  {postsMsg.dialog.fields.postReplies}
                </Label>
                <ReplyModeSelect
                  id="post-reply-mode"
                  variant="post"
                  value={replyMode}
                  onChange={onReplyModeChange}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-muted-foreground">
                  {effectiveReplyCopy.hint ??
                    interpolate(postsMsg.dialog.fields.effectiveState, {
                      label: effectiveReplyCopy.label.toLowerCase(),
                    })}
                  {" · "}
                  <Link
                    to={routes.persona}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {postsMsg.dialog.fields.editPersona}
                  </Link>
                </p>
              </div>

              <div className="grid w-full max-w-full min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="post-agent-active-days">
                    {postsMsg.dialog.fields.agentActiveDays}
                  </Label>
                  {agentActiveCampaignHint ? (
                    <span
                      className="inline-flex max-w-full rounded-full border border-amber-500/35 bg-amber-500/12 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-100"
                    >
                      {agentActiveCampaignHint}
                    </span>
                  ) : null}
                  <Input
                    id="post-agent-active-days"
                    type="number"
                    min={1}
                    max={365}
                    value={agentActiveDays}
                    onChange={(e) => onAgentActiveDaysChange(e.target.value)}
                    placeholder={postsMsg.dialog.fields.agentActiveDaysPlaceholder}
                    disabled={isReadOnly}
                    className="w-full max-w-full bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {postsMsg.dialog.fields.agentActiveDaysHint}
                  </p>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="post-private-reply-mode">
                    {postsMsg.dialog.fields.privateReplyMode}
                  </Label>
                  <ReplyModeSelect
                    id="post-private-reply-mode"
                    variant="post"
                    value={privateReplyMode}
                    onChange={onPrivateReplyModeChange}
                    disabled={isReadOnly}
                  />
                  <p className="text-xs text-muted-foreground">
                    {postsMsg.dialog.fields.privateReplyModeHint}
                  </p>
                </div>
              </div>

              {showCommentsSection ? (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {postsMsg.dialog.comments.title}
                    </p>
                    {post?.id ? (
                      <Link
                        to={`/comments?post_id=${post.id}`}
                        className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {postsMsg.dialog.comments.openInHub}
                      </Link>
                    ) : null}
                  </div>
                  {loadingComments && comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {postsMsg.dialog.comments.loading}
                    </p>
                  ) : threadGroups.length === 0 ? (
                    <p className="rounded-(--iris-radius-sm) border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                      {postsMsg.dialog.comments.empty}
                    </p>
                  ) : (
                    <CommentThread
                      groups={threadGroups}
                      allComments={comments}
                      brandUsername={metaIgUsername}
                      approvingId={approvingId}
                      removingDraftId={removingDraftId}
                      savingDraftId={savingDraftId}
                      generatingId={generatingId}
                      onApproveDraft={(commentId, draftText) =>
                        void handleApproveDraft(commentId, draftText)
                      }
                      onRemoveDraft={(commentId) =>
                        void handleRemoveDraft(commentId)
                      }
                      onSaveDraft={(commentId, draftText) =>
                        handleSaveDraft(commentId, draftText)
                      }
                      onGenerateDraft={(commentId) =>
                        void handleGenerateDraft(commentId)
                      }
                    />
                  )}
                </section>
              ) : null}
            </AppAccordion.Content>
          </AppAccordion.Item>

          <AppAccordion.Item value="schedule">
            <AppAccordion.Trigger>
              {postsMsg.dialog.sections.schedule}
            </AppAccordion.Trigger>
            <AppAccordion.Content>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                <div className="space-y-2 shrink-0">
                  <Label
                    htmlFor="post-scheduled-at"
                    className="text-sm font-semibold"
                  >
                    {isScheduled
                      ? postsMsg.dialog.fields.scheduledFor
                      : postsMsg.dialog.fields.scheduledAt}
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="post-scheduled-at"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => onScheduledAtChange(e.target.value)}
                      className="h-11 w-70 max-w-full shrink-0 bg-background text-base sm:text-sm"
                      disabled={isReadOnly || isCancelled}
                    />
                    {scheduledAt &&
                    !isReadOnly &&
                    !isCancelled &&
                    (isDraft || mode === "create") ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => onScheduledAtChange("")}
                      >
                        {postsMsg.dialog.schedule.clearDate}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-right text-sm leading-snug text-muted-foreground sm:max-w-md">
                  <span>
                    {interpolate(postsMsg.dialog.schedule.editorialTimezone, {
                      timezone: timeZone,
                    })}
                  </span>
                  {isDraft && scheduledAt ? (
                    <span>{postsMsg.dialog.schedule.confirmSchedule}</span>
                  ) : null}
                  {!metaConnected ? (
                    <span>{postsMsg.dialog.schedule.connectForSchedule}</span>
                  ) : null}
                </div>
              </div>
            </AppAccordion.Content>
          </AppAccordion.Item>
        </AppAccordion>

        {operationStatus ? (
          <p
            className="mt-4 flex items-start gap-2 rounded-(--iris-radius-sm) border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
            <span>{operationStatus}</span>
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-(--iris-radius-sm) border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </AppDialog.Body>

      <AppDialog.Footer className="justify-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {footerActions.map((action) => {
            const handler = footerHandlers[action.id];
            if (!handler) {
              return null;
            }
            return (
              <Button
                key={action.id}
                type="button"
                size="sm"
                variant={
                  action.variant === "destructive"
                    ? "destructive"
                    : action.variant
                }
                className={
                  action.id === "delete"
                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : action.variant === "ghost"
                      ? "text-muted-foreground hover:text-foreground"
                      : "min-h-8 px-3.5 py-1.5 text-sm leading-none"
                }
                onClick={handler}
                disabled={saving || Boolean(action.disabled)}
              >
                {saving && busyAction === action.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {action.label}
              </Button>
            );
          })}
          {statusBadge}
        </div>
      </AppDialog.Footer>
    </AppDialog>
  );
}
