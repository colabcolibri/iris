import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { PostDetailPanel } from "@/components/comments/post-detail-panel";
import { PostInboxList } from "@/components/comments/post-inbox-list";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMetaSession } from "@/hooks/use-meta-session";
import { firstMediaSlideSrc } from "@/hooks/use-post-preview";
import {
  approveCommentReply,
  fetchCommentPosts,
  fetchComments,
  fetchPostInsights,
  registerMonitoredPost,
  subscribeRealtimeEvents,
  syncPostComments,
} from "@/lib/api";
import type { Comment, CommentPostSummary, PostInsightsResult } from "@/lib/types";

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

export function CommentsPage() {
  const { meta, handleMetaHealth, handleDisconnect } = useMetaSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPostId = searchParams.get("post_id")?.trim() ?? "";

  const [posts, setPosts] = useState<CommentPostSummary[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [insights, setInsights] = useState<PostInsightsResult | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [mediaInput, setMediaInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingPost, setAddingPost] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(true);
  const [thumbnailOverrides, setThumbnailOverrides] = useState<Record<string, string>>({});

  const POLL_MS = 20_000;

  const selectedPost = useMemo(
    () => posts.find((post) => post.post_id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return posts;
    }

    return posts.filter((post) => {
      const caption = post.caption?.toLowerCase() ?? "";
      const mediaId = post.ig_media_id.toLowerCase();
      return caption.includes(query) || mediaId.includes(query);
    });
  }, [posts, searchQuery]);

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

  const loadInsights = useCallback(async (postId: string, silent = false) => {
    if (!postId || !meta?.connected) {
      setInsights(null);
      return;
    }

    if (!silent) {
      setLoadingInsights(true);
    }

    try {
      const result = await fetchPostInsights(postId);
      setInsights(result);

      const previewUrl = firstMediaSlideSrc(postId, result.media);
      if (previewUrl) {
        setThumbnailOverrides((current) =>
          current[postId] === previewUrl ? current : { ...current, [postId]: previewUrl },
        );
      }

      if (!result.ok && result.message && !silent && !result.insights?.length) {
        toast.error(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar insights.";
      setInsights({ ok: false, message, post_id: postId });
      if (!silent) {
        toast.error(message);
      }
    } finally {
      setLoadingInsights(false);
    }
  }, [meta?.connected]);

  const handleAddMonitoredPost = useCallback(async () => {
    const value = mediaInput.trim();
    if (!value) {
      toast.error("Informe o ID Meta ou o link do post.");
      return;
    }

    setAddingPost(true);
    try {
      const payload = /^\d{5,}$/.test(value)
        ? { ig_media_id: value }
        : { permalink: value };
      const post = await registerMonitoredPost(payload);
      await loadPosts();
      setSearchParams({ post_id: post.id });
      setAddDialogOpen(false);
      setMediaInput("");
      toast.success("Publicação adicionada para monitoramento.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao adicionar publicação.";
      toast.error(message);
    } finally {
      setAddingPost(false);
    }
  }, [loadPosts, mediaInput, setSearchParams]);

  const handleApproveDraft = useCallback(
    async (commentId: string, draftText?: string | null) => {
      setApprovingId(commentId);
      try {
        await approveCommentReply(commentId, draftText ?? undefined);
        if (selectedPostId) {
          await loadComments(selectedPostId, true);
          await loadPosts();
        }
        toast.success("Resposta publicada na Meta.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao aprovar resposta.";
        toast.error(message);
      } finally {
        setApprovingId(null);
      }
    },
    [loadComments, loadPosts, selectedPostId],
  );

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
      await loadInsights(selectedPostId, true);
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
  }, [loadInsights, loadPosts, selectedPostId]);

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
    void loadInsights(selectedPostId);
  }, [loadComments, loadInsights, selectedPostId]);

  useEffect(() => {
    return subscribeRealtimeEvents({
      onConnectionChange: setLiveConnected,
      onCommentsChanged: (data) => {
        if (data.post_id && data.post_id === selectedPostId) {
          void loadComments(selectedPostId, true);
          void loadPosts();
        }
      },
    });
  }, [loadComments, loadPosts, selectedPostId]);

  useEffect(() => {
    if (!selectedPostId) {
      return;
    }

    const poll = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void loadComments(selectedPostId, true);
    };

    const intervalId = window.setInterval(poll, POLL_MS);
    const onFocus = () => {
      void loadComments(selectedPostId, true);
      void loadPosts();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadComments, loadPosts, selectedPostId]);

  return (
    <AppShell meta={meta} onDisconnectMeta={handleDisconnect} onMetaHealth={handleMetaHealth}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-5 sm:px-6 md:px-8">
        <header className="mb-4 shrink-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Publicações
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Insights, comentários e respostas da IA por publicação.
          </p>
        </header>

        {!meta?.connected && (
          <Card className="mb-4 border-dashed p-4 text-sm text-muted-foreground">
            Conecte o Instagram em{" "}
            <Link to="/settings" className="text-primary underline-offset-4 hover:underline">
              configurações
            </Link>{" "}
            para sincronizar comentários e atualizar insights.
          </Card>
        )}

        {error ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!liveConnected ? (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            Atualização em tempo real indisponível — comentários são atualizados a cada 20 segundos
            com a página aberta.
          </p>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Inbox</h2>
                <p className="text-xs text-muted-foreground">
                  {posts.length} publicação{posts.length === 1 ? "" : "ões"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  disabled={!meta?.connected}
                >
                  <Plus className="mr-1 size-4" />
                  Adicionar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void loadPosts()}
                  disabled={loadingPosts}
                  aria-label="Recarregar lista"
                >
                  {loadingPosts ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-b p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar legenda ou ID…"
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-2">
              {loadingPosts ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">Carregando…</p>
              ) : filteredPosts.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">
                  {posts.length === 0
                    ? "Nenhuma publicação gerenciada ainda."
                    : "Nada encontrado na busca."}
                </p>
              ) : (
                <PostInboxList
                  posts={filteredPosts}
                  selectedPostId={selectedPostId}
                  thumbnailOverrides={thumbnailOverrides}
                  onSelect={(postId) => setSearchParams({ post_id: postId })}
                />
              )}
            </div>
          </aside>

          {selectedPost ? (
            <PostDetailPanel
              post={selectedPost}
              comments={displayComments}
              insights={insights}
              loadingComments={loadingComments}
              loadingInsights={loadingInsights}
              syncing={syncing}
              syncWarning={syncWarning}
              metaConnected={Boolean(meta?.connected)}
              approvingId={approvingId}
              onSync={() => void handleSync()}
              onRefreshInsights={() => void loadInsights(selectedPostId)}
              onApproveDraft={(commentId, draftText) =>
                void handleApproveDraft(commentId, draftText)
              }
            />
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-8 text-sm text-muted-foreground">
              Selecione uma publicação na lista.
            </div>
          )}
        </div>
      </div>

      {addDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md space-y-4 p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Adicionar publicação</h2>
              <p className="text-sm text-muted-foreground">
                Cole o link do post no Instagram (ex.: instagram.com/p/…) ou o ID numérico da Meta.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monitored-media-input">ID ou link</Label>
              <Input
                id="monitored-media-input"
                value={mediaInput}
                onChange={(e) => setMediaInput(e.target.value)}
                placeholder="https://www.instagram.com/p/… ou 17841400000000001"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleAddMonitoredPost()}
                disabled={addingPost}
              >
                {addingPost ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Adicionar
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
