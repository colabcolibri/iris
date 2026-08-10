import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMetaSession } from "@/hooks/use-meta-session";
import { fetchCommentsInbox } from "@/lib/api";
import type { CommentsInbox, CommentsInboxMedia } from "@/lib/types";

type InboxComment = CommentsInboxMedia["comments"][number];

function normalizeInbox(data: CommentsInbox): CommentsInbox {
  const media = data.media ?? [];

  if (data.summary) {
    return { ...data, media };
  }

  const commentsFetched = media.reduce((sum, item) => sum + (item.comments?.length ?? 0), 0);
  const commentsReported = media.reduce(
    (sum, item) => sum + (item.reported_comments_count ?? 0),
    0,
  );

  return {
    ...data,
    media,
    summary: {
      media_scanned: media.length,
      comments_reported: commentsReported,
      comments_fetched: commentsFetched,
      access_limited: commentsReported > 0 && commentsFetched === 0,
      warning: null,
    },
  };
}

type DisplayComment = InboxComment & {
  depth: number;
};

function buildDisplayComments(comments: InboxComment[]): DisplayComment[] {
  const byId = new Map(comments.map((comment) => [comment.ig_comment_id, comment]));
  const children = new Map<string, InboxComment[]>();

  for (const comment of comments) {
    const parentId = comment.parent_ig_comment_id;
    if (!parentId || !byId.has(parentId)) {
      continue;
    }

    const siblings = children.get(parentId) ?? [];
    siblings.push(comment);
    children.set(parentId, siblings);
  }

  const roots = comments.filter((comment) => {
    const parentId = comment.parent_ig_comment_id;
    return !parentId || !byId.has(parentId);
  });

  const ordered: DisplayComment[] = [];

  const walk = (comment: InboxComment, depth: number) => {
    ordered.push({ ...comment, depth });
    for (const child of children.get(comment.ig_comment_id) ?? []) {
      walk(child, depth + 1);
    }
  };

  for (const root of roots) {
    walk(root, 0);
  }

  return ordered;
}

function MediaCommentsCard({ item }: { item: CommentsInboxMedia }) {
  const comments = useMemo(() => buildDisplayComments(item.comments), [item.comments]);

  return (
    <Card className="space-y-4 border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {new Date(item.media_timestamp).toLocaleString("pt-BR")}
          {item.post_id ? (
            <>
              {" · "}
              <span className="text-primary">vinculado ao Iris</span>
            </>
          ) : (
            <>
              {" · "}
              <span>fora do Iris</span>
            </>
          )}
        </p>
        <h2 className="text-base font-semibold wrap-break-word">
          {item.caption?.trim() || "(sem legenda)"}
        </h2>
        <p className="text-xs text-muted-foreground break-all">
          ID: {item.ig_media_id}
          {(item.reported_comments_count ?? 0) > 0 && (
            <>
              {" · "}
              {item.reported_comments_count ?? 0} comentário
              {(item.reported_comments_count ?? 0) === 1 ? "" : "s"} na Meta
            </>
          )}
        </p>
      </header>

      {comments.length === 0 && (item.reported_comments_count ?? 0) > 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          A Meta informou {item.reported_comments_count ?? 0} comentário
          {(item.reported_comments_count ?? 0) === 1 ? "" : "s"} neste post, mas não liberou o conteúdo via
          API.
        </p>
      ) : null}

      <ul className="space-y-3">
        {comments.map((comment) => (
          <li
            key={comment.ig_comment_id}
            className="rounded-lg border bg-muted/40 p-3 text-sm"
            style={{ marginLeft: `${Math.min(comment.depth, 4) * 12}px` }}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <strong className="text-foreground">
                {comment.author_username ?? "usuário"}
              </strong>
              <span>{new Date(comment.timestamp).toLocaleString("pt-BR")}</span>
              {comment.status && (
                <span className="rounded bg-background px-1.5 py-0.5">{comment.status}</span>
              )}
            </div>
            <p className="wrap-break-word">{comment.text ?? "(sem texto)"}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CommentsPage() {
  const { meta, handleMetaHealth, handleDisconnect } = useMetaSession();
  const [inbox, setInbox] = useState<CommentsInbox | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadInbox = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = normalizeInbox(await fetchCommentsInbox(30));
      setInbox(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar comentários.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const summary = inbox?.summary;
  const totalComments =
    summary?.comments_fetched ??
    inbox?.media.reduce((sum, item) => sum + item.comments.length, 0) ??
    0;
  const totalReported = summary?.comments_reported ?? 0;

  return (
    <AppShell meta={meta} onDisconnectMeta={handleDisconnect} onMetaHealth={handleMetaHealth}>
      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 md:px-10">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Instagram
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight">Comentários</h1>
              <p className="text-sm text-muted-foreground">
                Últimos 30 dias da conta conectada, incluindo posts fora do Iris.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => void loadInbox(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Atualizar
            </Button>
          </header>

          {!meta?.connected && (
            <Card className="border-dashed p-4 text-sm text-muted-foreground">
              Conecte o Instagram em{" "}
              <Link to="/settings" className="text-primary underline-offset-4 hover:underline">
                configurações
              </Link>{" "}
              para sincronizar comentários.
            </Card>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Sincronizando comentários…</p>
          ) : error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : inbox ? (
            <>
              {summary?.access_limited && summary.warning && (
                <Card className="border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-50">
                  <p className="font-medium">Comentários bloqueados pela Meta (modo desenvolvimento)</p>
                  <p className="mt-2 text-amber-900/90 dark:text-amber-50/90">{summary.warning}</p>
                  <p className="mt-2 text-xs">
                    Encontramos {totalReported} comentário{totalReported === 1 ? "" : "s"} em{" "}
                    {inbox.media.length} post{inbox.media.length === 1 ? "" : "s"}, mas a API
                    devolveu 0 textos. Comentários novos ainda podem chegar via webhook.
                  </p>
                </Card>
              )}

              <p className="text-sm text-muted-foreground">
                {totalComments} comentário{totalComments === 1 ? "" : "s"} carregado
                {totalComments === 1 ? "" : "s"}
                {totalReported > totalComments
                  ? ` · ${totalReported} reportado${totalReported === 1 ? "" : "s"} pela Meta`
                  : ""}{" "}
                em {inbox.media.length} post{inbox.media.length === 1 ? "" : "s"} · sincronizado em{" "}
                {new Date(inbox.synced_at).toLocaleString("pt-BR")}
              </p>

              {inbox.media.length === 0 ? (
                <Card className="p-6 text-sm text-muted-foreground">
                  Nenhum comentário nos últimos 30 dias.
                </Card>
              ) : (
                <div className="space-y-4">
                  {inbox.media.map((item) => (
                    <MediaCommentsCard key={item.ig_media_id} item={item} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
