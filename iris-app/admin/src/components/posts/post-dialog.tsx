import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, Loader2 } from "lucide-react";
import { ReplyAuditSection } from "@/components/comments/reply-audit-section";
import { StatusBadge } from "@/components/posts/status-badge";
import { PostReplyStatusBadge } from "@/components/posts/post-reply-status-badge";
import { AppDialog } from "@/components/templates/app-dialog";
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
import {
  fetchAssetBlob,
  fetchReplyInspection,
  listAssets,
  replyToComment,
} from "@/lib/api";
import type { ReplyInspection, Post, ReplyMode } from "@/lib/types";

export type PostDialogMode = "create" | "edit";

type PostDialogProps = {
  open: boolean;
  mode: PostDialogMode | null;
  post: Post | null;
  metaConnected: boolean;
  metaIgUsername?: string | null;
  timeZone: string;
  saving: boolean;
  error: string;
  caption: string;
  scheduledAt: string;
  replyMode: ReplyMode;
  onOpenChange: (open: boolean) => void;
  onCaptionChange: (value: string) => void;
  onScheduledAtChange: (value: string) => void;
  onReplyModeChange: (value: ReplyMode) => void;
  onFilesChange: (files: FileList | null) => void;
  onSaveDraft: () => void;
  onSchedule: () => void;
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
  error,
  caption,
  scheduledAt,
  replyMode,
  onOpenChange,
  onCaptionChange,
  onScheduledAtChange,
  onReplyModeChange,
  onFilesChange,
  onSaveDraft,
  onSchedule,
  onRevertToDraft,
  onRetryDraft,
  onRetrySchedule,
}: PostDialogProps) {
  const { autoReplyEnabled: globalAutoReplyEnabled } = useAppSettings();
  const [inspection, setInspection] = useState<ReplyInspection | null>(null);
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    if (open) {
      setActiveTab("content");
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

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      if (!open || !post?.id) {
        setAssetUrls([]);
        return;
      }

      const assets = await listAssets(post.id);
      const nextUrls: string[] = [];

      for (const asset of assets) {
        const filename = asset.storage_path.split("/").pop();
        if (!filename) continue;
        const blob = await fetchAssetBlob(post.id, filename);
        nextUrls.push(URL.createObjectURL(blob));
      }

      if (!cancelled) setAssetUrls(nextUrls);
    }

    void loadAssets();

    return () => {
      cancelled = true;
      setAssetUrls((prev) => {
        for (const url of prev) URL.revokeObjectURL(url);
        return [];
      });
    };
  }, [open, post?.id]);

  if (!mode) return null;

  const title = mode === "create" ? "Nova postagem" : "Editar postagem";
  const comments = inspection?.comments ?? [];
  const status = post?.status;
  const isReadOnly = status === "published";
  const isScheduled = status === "scheduled";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";
  const isDraft = !status || status === "draft";
  const effectiveReply = resolveEffectivePostReplyStatus(globalAutoReplyEnabled, replyMode);
  const effectiveReplyCopy = replyStatusPresentation(effectiveReply);

  const statusHint = (() => {
    if (mode === "create") {
      return "Preencha legenda e mídia. Use “Agendar” para entrar no calendário editorial.";
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

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {post ? <StatusBadge status={post.status} /> : null}
      {(isScheduled || isCancelled) && onRevertToDraft ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={onRevertToDraft}
        >
          {isScheduled ? "Desagendar" : "Restaurar rascunho"}
        </Button>
      ) : null}
      {isFailed && onRetryDraft ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onRetryDraft}>
          Voltar a rascunho
        </Button>
      ) : null}
      {isFailed && onRetrySchedule ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onRetrySchedule}>
          Reagendar
        </Button>
      ) : null}
    </div>
  );

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} size="xl">
      <AppDialog.Header title={title} description={statusHint}>
        {headerActions}
      </AppDialog.Header>

      <AppDialog.Body>
        {isFailed && post?.error_message ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Causa da falha: {post.error_message}
          </p>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
          >
            <TabsTrigger value="content" className="px-3 pb-2.5">
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="schedule" className="px-3 pb-2.5">
              Agendamento
            </TabsTrigger>
            <TabsTrigger value="replies" className="px-3 pb-2.5">
              Respostas da IA
            </TabsTrigger>
            {showCommentsSection ? (
              <TabsTrigger value="comments" className="gap-1.5 px-3 pb-2.5">
                Comentários
                {comments.length > 0 ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                    {comments.length}
                  </span>
                ) : null}
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="content" className="mt-0 space-y-5">
            {status === "published" && post?.ig_media_id ? (
              <p className="text-xs text-muted-foreground">
                ID na Meta:{" "}
                <span className="font-mono text-foreground/80">{post.ig_media_id}</span>
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

            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              <section className="space-y-2">
                <Label
                  htmlFor="post-caption"
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Legenda
                </Label>
                <Textarea
                  id="post-caption"
                  value={caption}
                  onChange={(e) => onCaptionChange(e.target.value)}
                  rows={8}
                  className="min-h-[10rem] resize-none bg-background"
                  placeholder="Escreva a legenda da publicação…"
                  required
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </section>

              <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/15 p-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Mídia
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    PNG, JPEG ou WebP. Você pode selecionar vários arquivos.
                  </p>
                </div>

                {!isReadOnly ? (
                  <label
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/80 bg-background px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                  >
                    <CloudUpload className="mb-2 size-8 text-muted-foreground/70" />
                    <span className="text-sm font-medium">Adicionar mídia</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Arraste ou clique para selecionar
                    </span>
                    <Input
                      id="post-asset-files"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(e) => onFilesChange(e.target.files)}
                    />
                  </label>
                ) : null}

                {assetUrls.length > 0 ? (
                  <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                    {assetUrls.map((url) => (
                      <div
                        key={url}
                        className="overflow-hidden rounded-lg border border-border/60 bg-background"
                      >
                        <img src={url} alt="" className="aspect-square w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border/60 bg-background/50 px-3 py-6 text-center text-sm text-muted-foreground">
                    {isReadOnly ? "Sem preview de mídia." : "Nenhuma mídia adicionada ainda."}
                  </p>
                )}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0 space-y-4">
            <div className="max-w-md space-y-2">
              <Label htmlFor="post-scheduled-at" className="text-sm font-medium">
                {isScheduled ? "Publicação agendada para" : "Agendar para"}
              </Label>
              <Input
                id="post-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => onScheduledAtChange(e.target.value)}
                className="bg-background"
                disabled={isReadOnly || isCancelled}
              />
              <p className="text-xs text-muted-foreground">
                Fuso editorial: {timeZone}
                {isDraft && scheduledAt ? " · entra no calendário ao agendar" : ""}
              </p>
            </div>
            {!metaConnected ? (
              <p className="text-xs text-muted-foreground">
                Conecte o Instagram em configurações para agendar publicações.
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="replies" className="mt-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Modo de resposta</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Como a Iris deve responder comentários nesta publicação.
                </p>
              </div>
              <PostReplyStatusBadge
                post={{ reply_mode: replyMode }}
                globalAutoReplyEnabled={globalAutoReplyEnabled}
                size="md"
              />
            </div>

            {!globalAutoReplyEnabled ? (
              <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100">
                Agente pausado globalmente.{" "}
                <Link to="/settings" className="font-medium underline underline-offset-4">
                  Reativar em configurações
                </Link>
              </p>
            ) : null}

            <div className="max-w-xl space-y-2">
              <Label htmlFor="post-reply-mode" className="text-sm font-medium">
                Respostas da IA neste post
              </Label>
              <ReplyModeSelect
                id="post-reply-mode"
                value={replyMode}
                onChange={onReplyModeChange}
                disabled={isReadOnly}
              />
              <p className="text-xs text-muted-foreground">
                {effectiveReplyCopy.hint ??
                  `Estado efetivo agora: ${effectiveReplyCopy.label.toLowerCase()}.`}
                {" · "}
                <Link to="/persona" className="text-primary underline-offset-4 hover:underline">
                  Editar persona
                </Link>
              </p>
            </div>
          </TabsContent>

          {showCommentsSection ? (
            <TabsContent value="comments" className="mt-0 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Resumo dos comentários nesta publicação.
                </p>
                {post?.id ? (
                  <Link
                    to={`/comments?post_id=${post.id}`}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Abrir no hub
                  </Link>
                ) : null}
              </div>
              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : comments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                  Nenhum comentário neste post ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {comments.slice(0, 6).map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-lg border border-border/60 bg-background p-3 text-sm"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {comment.author_username ?? "usuário"}
                        </span>
                        <span>{new Date(comment.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="wrap-break-word leading-relaxed">{comment.text}</p>
                      {comment.status === "skipped" ||
                      comment.status === "failed" ||
                      comment.status === "replied" ? (
                        <ReplyAuditSection commentId={comment.id} className="mt-2" />
                      ) : null}
                      {comment.thread.length > 0 ? (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-primary">
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
                                <span className="font-medium text-foreground">
                                  {entry.is_brand_reply ? "marca" : (entry.author ?? "usuário")}
                                </span>
                                <span className="text-muted-foreground">
                                  {" · "}
                                  {new Date(entry.at).toLocaleString("pt-BR")}
                                </span>
                                <p className="text-muted-foreground">{entry.text}</p>
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
                            void replyToComment(comment.id, message).then(() =>
                              fetchReplyInspection(post.id).then(setInspection),
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
                      {comments.length - 6 === 1 ? "" : "s"} — use o hub de publicações.
                    </p>
                  ) : null}
                </div>
              )}
            </TabsContent>
          ) : null}
        </Tabs>

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </AppDialog.Body>

      <AppDialog.Footer className="justify-between sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <div className="flex flex-wrap gap-2">
          {!isReadOnly && !isCancelled ? (
            <>
              {(isDraft || mode === "create") ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSchedule}
                  disabled={saving || !metaConnected || !scheduledAt}
                >
                  Agendar publicação
                </Button>
              ) : null}
              {isScheduled ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSchedule}
                  disabled={saving || !metaConnected}
                >
                  Atualizar agendamento
                </Button>
              ) : null}
              <Button type="button" onClick={onSaveDraft} disabled={saving}>
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {isScheduled ? "Salvar alterações" : "Salvar rascunho"}
              </Button>
            </>
          ) : null}
        </div>
      </AppDialog.Footer>
    </AppDialog>
  );
}
