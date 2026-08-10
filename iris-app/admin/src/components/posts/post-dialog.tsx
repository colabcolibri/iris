import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/posts/status-badge";
import { AppDialog } from "@/components/templates/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAssetBlob,
  fetchReplyInspection,
  listAssets,
  replyToComment,
} from "@/lib/api";
import type { ReplyInspection, Post } from "@/lib/types";

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
  autoReply: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptionChange: (value: string) => void;
  onScheduledAtChange: (value: string) => void;
  onAutoReplyChange: (value: boolean) => void;
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
  autoReply,
  onOpenChange,
  onCaptionChange,
  onScheduledAtChange,
  onAutoReplyChange,
  onFilesChange,
  onSaveDraft,
  onSchedule,
  onRevertToDraft,
  onRetryDraft,
  onRetrySchedule,
}: PostDialogProps) {
  const [inspection, setInspection] = useState<ReplyInspection | null>(null);
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

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

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} size="xl">
      <AppDialog.Header title={title}>
        {post ? <StatusBadge status={post.status} /> : null}
      </AppDialog.Header>

      <AppDialog.Body>
        {statusHint && (
          <p className="mb-6 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {statusHint}
          </p>
        )}

        <div className="grid min-w-0 gap-8 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
            {isFailed && post?.error_message && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Causa da falha: {post.error_message}
              </p>
            )}

            {status === "published" && post?.ig_media_id && (
              <p className="text-sm text-muted-foreground">
                ID na Meta: {post.ig_media_id}
                {metaIgUsername && (
                  <>
                    {" · "}
                    <a
                      href={`https://www.instagram.com/${metaIgUsername}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Abrir perfil no Instagram
                    </a>
                  </>
                )}
              </p>
            )}

            {isFailed && (onRetryDraft || onRetrySchedule) && (
              <div className="flex flex-wrap gap-2">
                {onRetryDraft && (
                  <Button type="button" variant="outline" size="sm" onClick={onRetryDraft}>
                    Voltar a rascunho
                  </Button>
                )}
                {onRetrySchedule && (
                  <Button type="button" size="sm" onClick={onRetrySchedule}>
                    Reagendar
                  </Button>
                )}
              </div>
            )}

            {(isScheduled || isCancelled) && onRevertToDraft && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onRevertToDraft}>
                  {isScheduled ? "Desagendar (voltar a rascunho)" : "Restaurar como rascunho"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="post-caption" className="text-xs font-semibold tracking-wide uppercase">
                Legenda
              </Label>
              <Textarea
                id="post-caption"
                value={caption}
                onChange={(e) => onCaptionChange(e.target.value)}
                rows={5}
                className="min-h-32 resize-none border-0 border-b bg-muted/60 focus-visible:ring-0"
                required
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="post-scheduled-at" className="text-xs font-semibold tracking-wide uppercase">
                  {isScheduled ? "Publicação agendada para" : "Agendar para"}
                </Label>
                <Input
                  id="post-scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => onScheduledAtChange(e.target.value)}
                  className="border-0 border-b bg-muted/60 focus-visible:ring-0"
                  disabled={isReadOnly || isCancelled}
                />
                <p className="text-xs text-muted-foreground">
                  Horário no fuso editorial: {timeZone}
                  {isDraft && scheduledAt
                    ? " · a data só entra no calendário após agendar"
                    : ""}
                </p>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoReply}
                  onChange={(e) => onAutoReplyChange(e.target.checked)}
                  className="size-4 rounded border-border text-primary"
                />
                Resposta automática a comentários
              </label>
            </div>

            {post?.id && (
              <>
                <Separator />
                {inspection && (
                  <section className="space-y-3 rounded-lg border bg-muted/40 p-3">
                    <h3 className="text-sm font-semibold">Contexto do post</h3>
                    <p className="text-sm wrap-break-word text-muted-foreground">
                      {inspection.post_context.caption_truncated ?? "(sem legenda)"}
                    </p>
                    {inspection.auto_reply_enabled && (
                      <p className="text-xs">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                          Auto-reply ativo
                        </span>
                        {" · "}
                        <Link
                          to="/persona"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Editar persona
                        </Link>
                      </p>
                    )}
                  </section>
                )}
                <section className="space-y-3">
                  <h3 className="border-b pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Comentários
                  </h3>
                  {loadingComments ? (
                    <p className="text-sm text-muted-foreground">Carregando…</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <article
                          key={comment.id}
                          className="rounded-lg border bg-muted/40 p-3 text-sm"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <strong className="text-foreground">
                              {comment.author_username ?? "usuário"}
                            </strong>
                            <span>{new Date(comment.created_at).toLocaleString("pt-BR")}</span>
                          </div>
                          <p className="wrap-break-word">{comment.text}</p>
                          {comment.thread.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-primary">
                                Ver conversa
                              </summary>
                              <ul className="mt-2 space-y-2 border-l-2 border-muted text-xs">
                                {comment.thread.map((entry, index) => (
                                  <li
                                    key={`${comment.id}-${index}`}
                                    className="wrap-break-word"
                                    style={{
                                      marginLeft: `${Math.min(entry.depth, 4) * 12}px`,
                                      paddingLeft: "0.75rem",
                                    }}
                                  >
                                    <span className="font-medium text-foreground">
                                      {entry.is_brand_reply
                                        ? "marca"
                                        : (entry.author ?? "usuário")}
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
                          )}
                          {comment.status === "pending" && (
                            <form
                              className="mt-3 space-y-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const message = replyDrafts[comment.id]?.trim();
                                if (!message) return;
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
                                className="resize-none"
                              />
                              <Button type="submit" size="sm">
                                Responder
                              </Button>
                            </form>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Mídia
            </Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary hover:bg-muted/50">
              <CloudUpload className="mb-2 size-8 text-muted-foreground" />
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

            {assetUrls.length > 0 && (
              <div className="grid min-w-0 grid-cols-3 gap-2">
                {assetUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-square w-full max-w-full rounded-md border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {!metaConnected && (
          <p className="mt-6 text-xs text-muted-foreground">
            Conecte o Instagram para agendar publicações.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </AppDialog.Body>

      <AppDialog.Footer className="justify-between sm:justify-between">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <div className="flex flex-wrap gap-2">
          {!isReadOnly && !isCancelled && (
            <>
              {(isDraft || mode === "create") && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary text-primary"
                  onClick={onSchedule}
                  disabled={saving || !metaConnected || !scheduledAt}
                >
                  Agendar publicação
                </Button>
              )}
              {isScheduled && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary text-primary"
                  onClick={onSchedule}
                  disabled={saving || !metaConnected}
                >
                  Atualizar agendamento
                </Button>
              )}
              <Button type="button" onClick={onSaveDraft} disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isScheduled ? "Salvar alterações" : "Salvar rascunho"}
              </Button>
            </>
          )}
        </div>
      </AppDialog.Footer>
    </AppDialog>
  );
}
