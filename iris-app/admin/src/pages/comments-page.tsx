import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMetaSession } from "@/hooks/use-meta-session";
import {
  fetchCommentPosts,
  fetchComments,
  subscribeRealtimeEvents,
  syncPostComments,
} from "@/lib/api";
import type { Comment, CommentPostSummary } from "@/lib/types";

type DisplayComment = Comment & {
  depth: number;
};

function buildDisplayComments(comments: Comment[]): DisplayComment[] {
  const byIgId = new Map(
    comments
      .filter((comment) => comment.ig_comment_id)
      .map((comment) => [comment.ig_comment_id!, comment]),
  );
  const children = new Map<string, Comment[]>();

  for (const comment of comments) {
    const parentId = comment.parent_ig_comment_id;
    if (!parentId || !byIgId.has(parentId)) {
      continue;
    }

    const siblings = children.get(parentId) ?? [];
    siblings.push(comment);
    children.set(parentId, siblings);
  }

  const roots = comments.filter((comment) => {
    const parentId = comment.parent_ig_comment_id;
    return !parentId || !byIgId.has(parentId);
  });

  const ordered: DisplayComment[] = [];

  const walk = (comment: Comment, depth: number) => {
    ordered.push({ ...comment, depth });
    const igCommentId = comment.ig_comment_id;
    if (!igCommentId) {
      return;
    }

    for (const child of children.get(igCommentId) ?? []) {
      walk(child, depth + 1);
    }
  };

  for (const root of roots) {
    walk(root, 0);
  }

  return ordered;
}

function PostListItem({
  post,
  selected,
  onSelect,
}: {
  post: CommentPostSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-border/70 bg-card/80 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="line-clamp-2 text-sm font-medium">
            {post.caption?.trim() || "(sem legenda)"}
          </p>
          <p className="text-xs text-muted-foreground">
            {post.published_at
              ? new Date(post.published_at).toLocaleString("pt-BR")
              : "sem data de publicação"}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{post.comments_count}</p>
          <p>coment.</p>
          {post.pending_count > 0 ? (
            <p className="mt-1 text-amber-700 dark:text-amber-300">{post.pending_count} pend.</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function CommentsPage() {
  const { meta, handleMetaHealth, handleDisconnect } = useMetaSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPostId = searchParams.get("post_id")?.trim() ?? "";

  const [posts, setPosts] = useState<CommentPostSummary[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.post_id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const displayComments = useMemo(() => buildDisplayComments(comments), [comments]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setError("");

    try {
      const nextPosts = await fetchCommentPosts();
      setPosts(nextPosts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar postagens.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadComments = useCallback(async (postId: string, silent = false) => {
    if (!postId) {
      setComments([]);
      return;
    }

    if (!silent) {
      setLoadingComments(true);
    }

    try {
      const nextComments = await fetchComments(postId);
      setComments(nextComments);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar comentários.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (!selectedPostId) {
      return;
    }

    setSyncing(true);
    setSyncWarning(null);
    setError("");

    try {
      const result = await syncPostComments(selectedPostId);
      setComments(result.comments);
      setSyncWarning(result.warning);
      await loadPosts();
      toast.success(
        result.comments_fetched > 0
          ? `${result.comments_fetched} comentário${result.comments_fetched === 1 ? "" : "s"} sincronizado${result.comments_fetched === 1 ? "" : "s"}.`
          : "Nenhum comentário novo na Meta para este post.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao sincronizar comentários.";
      setError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }, [loadPosts, selectedPostId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!selectedPostId && posts[0]) {
      setSearchParams({ post_id: posts[0].post_id });
    }
  }, [posts, selectedPostId, setSearchParams]);

  useEffect(() => {
    void loadComments(selectedPostId);
  }, [loadComments, selectedPostId]);

  useEffect(() => {
    return subscribeRealtimeEvents({
      onCommentsChanged: (data) => {
        if (data.post_id && data.post_id === selectedPostId) {
          void loadComments(selectedPostId, true);
          void loadPosts();
        }
      },
    });
  }, [loadComments, loadPosts, selectedPostId]);

  return (
    <AppShell meta={meta} onDisconnectMeta={handleDisconnect} onMetaHealth={handleMetaHealth}>
      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 md:px-10">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <header className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Instagram
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Comentários</h1>
            <p className="text-sm text-muted-foreground">
              Selecione uma postagem publicada pelo Iris. Novos comentários chegam via webhook;
              sincronize com a Meta só quando precisar de histórico.
            </p>
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

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <Card className="space-y-3 border-border/80 bg-card/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Postagens publicadas</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void loadPosts()}
                  disabled={loadingPosts}
                >
                  {loadingPosts ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                </Button>
              </div>

              {loadingPosts ? (
                <p className="text-sm text-muted-foreground">Carregando postagens…</p>
              ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma postagem publicada com ID da Meta ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {posts.map((post) => (
                    <PostListItem
                      key={post.post_id}
                      post={post}
                      selected={post.post_id === selectedPostId}
                      onSelect={() => setSearchParams({ post_id: post.post_id })}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-4 border-border/80 bg-card/90 p-4 shadow-sm sm:p-5">
              {!selectedPost ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="size-8 opacity-40" />
                  <p>Selecione uma postagem para ver os comentários.</p>
                </div>
              ) : (
                <>
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h2 className="text-base font-semibold wrap-break-word">
                        {selectedPost.caption?.trim() || "(sem legenda)"}
                      </h2>
                      <p className="text-xs text-muted-foreground break-all">
                        ID Meta: {selectedPost.ig_media_id}
                        {selectedPost.published_at ? (
                          <>
                            {" · "}
                            {new Date(selectedPost.published_at).toLocaleString("pt-BR")}
                          </>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPost.comments_count} salvo
                        {selectedPost.comments_count === 1 ? "" : "s"} localmente
                        {selectedPost.pending_count > 0
                          ? ` · ${selectedPost.pending_count} pendente${selectedPost.pending_count === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSync()}
                      disabled={!meta?.connected || syncing || loadingComments}
                    >
                      {syncing ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 size-4" />
                      )}
                      Sincronizar este post
                    </Button>
                  </header>

                  {syncWarning ? (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                      {syncWarning}
                    </p>
                  ) : null}

                  {loadingComments ? (
                    <p className="text-sm text-muted-foreground">Carregando comentários…</p>
                  ) : displayComments.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
                      Nenhum comentário salvo para este post. Novos comentários chegam via webhook
                      ou use sincronizar para buscar histórico na Meta.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {displayComments.map((comment) => (
                        <li
                          key={comment.id}
                          className="rounded-lg border bg-muted/40 p-3 text-sm"
                          style={{ marginLeft: `${Math.min(comment.depth, 4) * 12}px` }}
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <strong className="text-foreground">
                              {comment.author_username ?? "usuário"}
                            </strong>
                            <span>{new Date(comment.created_at).toLocaleString("pt-BR")}</span>
                            {comment.status ? (
                              <span className="rounded bg-background px-1.5 py-0.5">
                                {comment.status}
                              </span>
                            ) : null}
                          </div>
                          <p className="wrap-break-word">{comment.text ?? "(sem texto)"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
