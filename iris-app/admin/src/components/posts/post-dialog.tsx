import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  commentTextClassName,
  displayCommentText,
} from "@/lib/comment-text-display";
import { ROUTES } from "@/lib/routes";
import { ReplyAuditSection } from "@/components/comments/reply-audit-section";
import { CarouselSummaryEditor } from "@/components/comments/carousel-summary-editor";
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
import {
  replyStatusPresentation,
  resolveEffectivePostReplyStatus,
} from "@iris/domain/reply-effective-status";
import { fetchReplyInspection, replyToComment } from "@/lib/api";
import type { ReplyInspection, Post, PostReplyModeSetting } from "@/lib/types";

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
  const { replyMode: globalReplyMode } = useAppSettings();
  const [inspection, setInspection] = useState<ReplyInspection | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<string[]>(["content"]);
  const [contentTab, setContentTab] = useState("caption");

  useEffect(() => {
    if (open) {
      setOpenSections(["content"]);
      setContentTab("caption");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !post?.id || mode !== "edit") {
      setInspection(null);
      return;
    }

    setLoadingComments(true);
    void fetchReplyInspection(post.id)
      .then(setInspection)
      .finally(() => setLoadingComments(false));
  }, [open, post?.id, mode]);

  if (!mode) return null;

  const title = mode === "create" ? "Nova postagem" : "Editar postagem";
  const comments = inspection?.comments ?? [];
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

  const statusHint = (() => {
    if (mode === "create") {
      return "Preencha legenda, resumo e briefing antes de salvar. Use “Agendar” para entrar no calendário editorial.";
    }
    switch (status) {
      case "draft":
        return "Rascunho — não aparece no calendário até ser agendado.";
      case "scheduled":
        return "Agendado — aparece no calendário e será publicado automaticamente.";
      case "published":
        return "Publicado — já está no Instagram.";
      case "failed":
        return "Falhou na publicação — revise mídia, legenda ou conexão Meta.";
      case "cancelled":
        return "Cancelado — restaure como rascunho para editar novamente.";
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
            Causa da falha: {post.error_message}
          </p>
        ) : null}

        <AppAccordion
          multiple
          value={openSections}
          onValueChange={setOpenSections}
        >
          <AppAccordion.Item value="content">
            <AppAccordion.Trigger>Conteúdo</AppAccordion.Trigger>
            <AppAccordion.Content className="space-y-8">
              {status === "published" && post?.ig_media_id ? (
                <p className="text-xs text-muted-foreground">
                  ID na Meta:{" "}
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
                        Abrir perfil
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
                    Legenda
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="shrink-0">
                    Resumo
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="shrink-0">
                    Prompt adicional
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="caption" className="min-w-0 space-y-4">
                  <Textarea
                    id="post-caption"
                    value={caption}
                    onChange={(e) => onCaptionChange(e.target.value)}
                    rows={8}
                    className="min-h-40 w-full resize-y bg-background"
                    placeholder="Escreva a legenda da publicação…"
                    required
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="post-collaborators">
                      Colaboradores (Instagram)
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
                      placeholder="username + Enter (até 3)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Até 3 usernames convidados como collab no publish. Eles
                      precisam aceitar o convite no Instagram. Não é tag na
                      foto.
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
                <span>Resposta IA</span>
                {showCommentsSection && comments.length > 0 ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {comments.length} comentário
                    {comments.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </span>
            </AppAccordion.Trigger>
            <AppAccordion.Content className="w-full max-w-full min-w-0 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Modo de resposta
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Como a Iris deve responder comentários nesta publicação.
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
                  Respostas da IA neste post
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
                    `Estado efetivo agora: ${effectiveReplyCopy.label.toLowerCase()}.`}
                  {" · "}
                  <Link
                    to={ROUTES.admin.persona}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Editar persona
                  </Link>
                </p>
              </div>

              {showCommentsSection ? (
                <section className="space-y-3 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Comentários
                    </p>
                    {post?.id ? (
                      <Link
                        to={`/comments?post_id=${post.id}`}
                        className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Abrir no hub
                      </Link>
                    ) : null}
                  </div>
                  {loadingComments ? (
                    <p className="text-sm text-muted-foreground">Carregando…</p>
                  ) : comments.length === 0 ? (
                    <p className="rounded-(--iris-radius-sm) border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                      Nenhum comentário neste post ainda.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {comments.slice(0, 6).map((comment) => (
                        <article
                          key={comment.id}
                          className="rounded-(--iris-radius-sm) border border-border/60 bg-background p-3 text-sm"
                        >
                          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {comment.author_username ?? "usuário"}
                            </span>
                            <span>
                              {new Date(comment.created_at).toLocaleString(
                                "pt-BR",
                              )}
                            </span>
                          </div>
                          <p className={commentTextClassName}>
                            {displayCommentText(comment.text)}
                          </p>
                          {comment.status === "skipped" ||
                          comment.status === "failed" ||
                          comment.status === "replied" ? (
                            <ReplyAuditSection
                              commentId={comment.id}
                              className="mt-2"
                            />
                          ) : null}
                          {comment.thread.length > 0 ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-semibold text-primary">
                                Ver conversa ({comment.thread.length})
                              </summary>
                              <ul className="mt-2 space-y-2 border-l-2 border-border/60 pl-3 text-xs">
                                {comment.thread.map((entry, index) => (
                                  <li
                                    key={`${comment.id}-${index}`}
                                    className="wrap-break-word"
                                    style={{
                                      marginLeft: `${Math.min(entry.depth, 4) * 10}px`,
                                    }}
                                  >
                                    <span className="font-semibold text-foreground">
                                      {entry.is_brand_reply
                                        ? "marca"
                                        : (entry.author ?? "usuário")}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {" · "}
                                      {new Date(entry.at).toLocaleString(
                                        "pt-BR",
                                      )}
                                    </span>
                                    <p className="text-muted-foreground">
                                      {entry.text}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : null}
                          {comment.status === "pending" ? (
                            <form
                              className="mt-3 space-y-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const message = replyDrafts[comment.id]?.trim();
                                if (!message || !post?.id) return;
                                void replyToComment(comment.id, message).then(
                                  () =>
                                    fetchReplyInspection(post.id).then(
                                      setInspection,
                                    ),
                                );
                              }}
                            >
                              <Textarea
                                placeholder="Responder…"
                                value={replyDrafts[comment.id] ?? ""}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [comment.id]: e.target.value,
                                  }))
                                }
                                rows={2}
                                className="resize-none bg-background"
                              />
                              <Button type="submit" size="sm" variant="outline">
                                Responder
                              </Button>
                            </form>
                          ) : null}
                        </article>
                      ))}
                      {comments.length > 6 ? (
                        <p className="text-xs text-muted-foreground">
                          +{comments.length - 6} comentário
                          {comments.length - 6 === 1 ? "" : "s"} — use o hub de
                          publicações.
                        </p>
                      ) : null}
                    </div>
                  )}
                </section>
              ) : null}
            </AppAccordion.Content>
          </AppAccordion.Item>

          <AppAccordion.Item value="schedule">
            <AppAccordion.Trigger>Agendamento</AppAccordion.Trigger>
            <AppAccordion.Content>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                <div className="space-y-2 shrink-0">
                  <Label
                    htmlFor="post-scheduled-at"
                    className="text-sm font-semibold"
                  >
                    {isScheduled ? "Publicação agendada para" : "Agendar para"}
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
                        Limpar data
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-right text-sm leading-snug text-muted-foreground sm:max-w-md">
                  <span>Fuso editorial: {timeZone}</span>
                  {isDraft && scheduledAt ? (
                    <span>Confirme com “Agendar publicação”.</span>
                  ) : null}
                  {!metaConnected ? (
                    <span>
                      Conecte o Instagram em configurações para agendar
                      publicações.
                    </span>
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
