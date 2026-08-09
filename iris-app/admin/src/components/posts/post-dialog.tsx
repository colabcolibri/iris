import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
  onRetryDraft?: () => void;
  onRetrySchedule?: () => void;
};

export function PostDialog({
  open,
  mode,
  post,
  metaConnected,
  metaIgUsername,
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
  const description =
    mode === "create"
      ? "Crie um rascunho ou agende para o Instagram."
      : "Revise legenda, mídia e agendamento.";
  const comments = inspection?.comments ?? [];

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} size="xl">
      <AppDialog.Header title={title} description={description}>
        {post ? <StatusBadge status={post.status} /> : null}
      </AppDialog.Header>

      <AppDialog.Body>
        <div className="min-w-0 space-y-5">
          {post?.status === "failed" && post.error_message && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Causa da falha: {post.error_message}
            </p>
          )}

          {post?.status === "published" && post.ig_media_id && (
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

          {post?.status === "failed" && (onRetryDraft || onRetrySchedule) && (
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-caption">Legenda</Label>
              <Textarea
                id="post-caption"
                value={caption}
                onChange={(e) => onCaptionChange(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-scheduled-at">Agendar para</Label>
              <Input
                id="post-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => onScheduledAtChange(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => onAutoReplyChange(e.target.checked)}
              />
              Resposta automática a comentários
            </label>

            <div className="space-y-2">
              <Label htmlFor="post-asset-files">Imagens</Label>
              <Input
                id="post-asset-files"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(e) => onFilesChange(e.target.files)}
              />
            </div>

            {assetUrls.length > 0 && (
              <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                {assetUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-square w-full max-w-full rounded-lg border object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {!metaConnected && (
            <p className="text-xs text-muted-foreground">
              Conecte o Instagram para agendar publicações.
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {post?.id && (
            <>
              <Separator />
              {inspection && (
                <section className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <h3 className="text-sm font-semibold">Contexto do post</h3>
                  <p className="text-sm text-muted-foreground break-words">
                    {inspection.post_context.caption_truncated ?? "(sem legenda)"}
                  </p>
                  {inspection.post_context.assets.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {inspection.post_context.assets.map((asset) =>
                        asset.public_url ? (
                          <img
                            key={asset.filename}
                            src={asset.public_url}
                            alt=""
                            className="aspect-square rounded-lg border object-cover"
                          />
                        ) : null,
                      )}
                    </div>
                  )}
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
              <section className="max-h-80 space-y-3 overflow-y-auto">
                <h3 className="text-sm font-semibold">Comentários</h3>
                {loadingComments ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <article key={comment.id} className="rounded-lg border bg-card p-3 text-sm">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <strong className="text-foreground">
                            {comment.author_username ?? "usuário"}
                          </strong>
                          <span>{comment.status}</span>
                          <span>{new Date(comment.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="break-words">{comment.text}</p>
                        {comment.thread.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-primary">
                              Ver conversa
                            </summary>
                            <ul className="mt-2 space-y-2 border-l-2 border-muted pl-3 text-xs">
                              {comment.thread.map((entry, index) => (
                                <li key={`${comment.id}-${index}`} className="break-words">
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
                              placeholder="Sua resposta…"
                              value={replyDrafts[comment.id] ?? ""}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [comment.id]: e.target.value,
                                }))
                              }
                              rows={2}
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
      </AppDialog.Body>

      <AppDialog.Footer>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <Button type="button" variant="secondary" onClick={onSchedule} disabled={saving || !metaConnected}>
          Agendar
        </Button>
        <Button type="button" onClick={onSaveDraft} disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Salvar rascunho
        </Button>
      </AppDialog.Footer>
    </AppDialog>
  );
}
