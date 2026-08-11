import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Plus, RefreshCw, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { ImportPostsDialog } from "@/components/comments/import-posts-dialog";
import { PostDetailPanel } from "@/components/comments/post-detail-panel";
import { PostInboxList } from "@/components/comments/post-inbox-list";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useMetaSession } from "@/contexts/meta-session-context";
import { firstMediaSlideSrc } from "@/hooks/use-post-preview";
import {
  approveCommentReply,
  fetchCommentPosts,
  fetchComments,
  fetchPostInsights,
  fetchReconcileCommentsPreview,
  registerMonitoredPost,
  reconcilePostComments,
  removeCommentDraft,
  requestCommentAiReply,
  updateCommentDraft,
  subscribeRealtimeEvents,
  syncPostComments,
  updatePost,
} from "@/lib/api";
import {
  buildCommentThreadGroups,
  sortCommentThreadGroups,
  type ThreadSortMode,
} from "@/lib/build-comment-tree";
import type { Comment, CommentPostSummary, PostInsightsResult, PostReplyModeSetting } from "@/lib/types";
import { postReplyModeOption } from "@/lib/reply-mode-options";
import {
  COMMENTS_CACHE_STALE_MS,
  CommentsPostCache,
  derivePostCountsFromComments,
  INSIGHTS_CACHE_STALE_MS,
  isCacheFresh,
  patchPostSummaryCounts,
  POSTS_CACHE_STALE_MS,
  postsHaveChanged,
} from "@/lib/comments-post-cache";

const COMMENTS_FALLBACK_POLL_MS = 60_000;
const COMMENTS_REALTIME_DEBOUNCE_MS = 750;

function commentsHaveChanged(current: Comment[], next: Comment[]): boolean {
  if (current.length !== next.length) {
    return true;
  }

  return next.some((comment, index) => {
    const previous = current[index];
    if (!previous || previous.id !== comment.id) {
      return true;
    }

    return (
      previous.status !== comment.status ||
      previous.text !== comment.text ||
      previous.deleted_at !== comment.deleted_at ||
      previous.draft_text !== comment.draft_text ||
      previous.error_message !== comment.error_message ||
      previous.linked_reply_text !== comment.linked_reply_text
    );
  });
}

export function CommentsPage() {
  const { meta } = useMetaSession();
  const { confirm } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPostId = searchParams.get("post_id")?.trim() ?? "";

  const [posts, setPosts] = useState<CommentPostSummary[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [insights, setInsights] = useState<PostInsightsResult | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshingPosts, setRefreshingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState("");
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [mediaInput, setMediaInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingPost, setAddingPost] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [removingDraftId, setRemovingDraftId] = useState<string | null>(null);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [savingReplyMode, setSavingReplyMode] = useState(false);
  const [threadSort, setThreadSort] = useState<ThreadSortMode>("activity_desc");
  const [liveConnected, setLiveConnected] = useState(true);
  const [thumbnailOverrides, setThumbnailOverrides] = useState<Record<string, string>>({});
  const commentsRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postCacheRef = useRef(new CommentsPostCache());
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.post_id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const selectedReplyMode = useMemo<PostReplyModeSetting>(() => {
    if (!selectedPost) {
      return "inherit";
    }

    return (
      selectedPost.reply_mode ??
      (selectedPost.auto_reply_enabled ? "auto" : "inherit")
    );
  }, [selectedPost]);

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

  const threadGroups = useMemo(
    () => sortCommentThreadGroups(buildCommentThreadGroups(comments), threadSort),
    [comments, threadSort],
  );

  const loadPosts = useCallback(async (options: { silent?: boolean; force?: boolean } = {}) => {
    const { silent = false, force = false } = options;
    const cached = postCacheRef.current.getPosts();

    if (cached) {
      setPosts((current) => (current.length === 0 ? cached.data : current));
      if (!force && isCacheFresh(cached.fetchedAt, POSTS_CACHE_STALE_MS)) {
        setLoadingPosts(false);
        return cached.data;
      }
    }

    if (!silent) {
      setRefreshingPosts(true);
    }

    setError("");

    try {
      const nextPosts = await fetchCommentPosts();
      const fetchedAt = Date.now();
      postCacheRef.current.setPosts(nextPosts, fetchedAt);
      const activePostIds = new Set(nextPosts.map((post) => post.post_id));
      postCacheRef.current.pruneInactivePostIds(activePostIds);
      setPosts((current) => (postsHaveChanged(current, nextPosts) ? nextPosts : current));
      setThumbnailOverrides((current) => {
        const next: Record<string, string> = {};
        for (const [postId, url] of Object.entries(current)) {
          if (activePostIds.has(postId)) {
            next[postId] = url;
          }
        }
        return Object.keys(next).length === Object.keys(current).length ? current : next;
      });
      return nextPosts;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar postagens.";
      setError(message);
      if (!silent) {
        toast.error(message);
      }
      return null;
    } finally {
      setLoadingPosts(false);
      setRefreshingPosts(false);
    }
  }, []);

  const syncPostCountsFromComments = useCallback(
    (postId: string, nextComments: Comment[]) => {
      const counts = derivePostCountsFromComments(nextComments);
      setPosts((current) => {
        const patched = patchPostSummaryCounts(current, postId, counts);
        if (patched === current) {
          return current;
        }

        const postsCache = postCacheRef.current.getPosts();
        if (postsCache) {
          postCacheRef.current.setPosts(patched, postsCache.fetchedAt);
        }

        return patched;
      });
    },
    [],
  );

  const loadComments = useCallback(
    async (postId: string, options: { silent?: boolean; force?: boolean } = {}) => {
      const { silent = false, force = false } = options;
      if (!postId) {
        setComments([]);
        return;
      }

      const cached = postCacheRef.current.getComments(postId);
      if (cached) {
        setComments(cached.data);
      }

      if (!force && cached && isCacheFresh(cached.fetchedAt, COMMENTS_CACHE_STALE_MS)) {
        return;
      }

      if (!silent && !cached) {
        setLoadingComments(true);
      }

      try {
        const nextComments = await fetchComments(postId);
        const fetchedAt = Date.now();
        postCacheRef.current.setComments(postId, nextComments, fetchedAt);
        setComments((current) =>
          commentsHaveChanged(current, nextComments) ? nextComments : current,
        );
        syncPostCountsFromComments(postId, nextComments);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao carregar comentários.";
        setError(message);
        toast.error(message);
      } finally {
        setLoadingComments(false);
      }
    },
    [syncPostCountsFromComments],
  );

  const loadInsights = useCallback(
    async (postId: string, options: { silent?: boolean; force?: boolean } = {}) => {
      const { silent = false, force = false } = options;
      if (!postId || !meta?.connected) {
        setInsights(null);
        return;
      }

      const cached = postCacheRef.current.getInsights(postId);
      if (cached) {
        setInsights(cached.data);
      }

      if (!force && cached && isCacheFresh(cached.fetchedAt, INSIGHTS_CACHE_STALE_MS)) {
        return;
      }

      if (!silent && !cached) {
        setLoadingInsights(true);
      }

      try {
        const result = await fetchPostInsights(postId);
        const fetchedAt = Date.now();
        postCacheRef.current.setInsights(postId, result, fetchedAt);
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
        const fallback = { ok: false, message, post_id: postId } satisfies PostInsightsResult;
        if (!cached) {
          setInsights(fallback);
        }
        if (!silent) {
          toast.error(message);
        }
      } finally {
        setLoadingInsights(false);
      }
    },
    [meta?.connected],
  );

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
      postCacheRef.current.invalidatePosts();
      await loadPosts({ force: true });
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
          await loadComments(selectedPostId, { silent: true, force: true });
        }
        toast.success("Resposta publicada na Meta.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao aprovar resposta.";
        toast.error(message);
      } finally {
        setApprovingId(null);
      }
    },
    [loadComments, selectedPostId],
  );

  const handleGenerateDraft = useCallback(
    async (commentId: string) => {
      const comment = comments.find((item) => item.id === commentId);
      const preview = comment?.text?.trim()
        ? comment.text.trim().length > 120
          ? `${comment.text.trim().slice(0, 119)}…`
          : comment.text.trim()
        : "(sem texto)";

      const ok = await confirm({
        title: "Gerar rascunho?",
        description: (
          <>
            A Iris vai analisar este comentário e gerar uma sugestão de resposta. Nada será
            publicado no Instagram até você aprovar.
            {comment ? (
              <span className="mt-2 block rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-sm text-foreground">
                “{preview}”
              </span>
            ) : null}
          </>
        ),
        confirmLabel: "Gerar rascunho",
      });

      if (!ok) {
        return;
      }

      setGeneratingId(commentId);
      try {
        const updated = await requestCommentAiReply(commentId, "draft");
        if (selectedPostId) {
          await loadComments(selectedPostId, { silent: true, force: true });
        }
        if (updated.status === "failed" || updated.status === "skipped") {
          toast.error(updated.error_message ?? "A IA não conseguiu gerar o rascunho.");
          return;
        }
        toast.success("Rascunho gerado.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao gerar rascunho.";
        toast.error(message);
        if (selectedPostId) {
          await loadComments(selectedPostId, { silent: true, force: true });
        }
      } finally {
        setGeneratingId(null);
      }
    },
    [comments, confirm, loadComments, selectedPostId],
  );

  const handleReplyModeChange = useCallback(
    async (next: PostReplyModeSetting) => {
      if (!selectedPost) {
        return;
      }

      setSavingReplyMode(true);
      try {
        await updatePost(selectedPost.post_id, { reply_mode: next });
        setPosts((current) =>
          current.map((post) =>
            post.post_id === selectedPost.post_id
              ? {
                  ...post,
                  reply_mode: next,
                  auto_reply_enabled: next === "auto" || next === "draft",
                }
              : post,
          ),
        );
        toast.success(`Modo deste post: ${postReplyModeOption(next).label.toLowerCase()}.`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Não foi possível atualizar o modo de resposta.";
        toast.error(message);
      } finally {
        setSavingReplyMode(false);
      }
    },
    [selectedPost],
  );

  const handleRemoveDraft = useCallback(
    async (commentId: string) => {
      const comment = comments.find((item) => item.id === commentId);
      const preview = comment?.draft_text?.trim()
        ? comment.draft_text.trim().length > 120
          ? `${comment.draft_text.trim().slice(0, 119)}…`
          : comment.draft_text.trim()
        : null;

      const ok = await confirm({
        title: "Deletar rascunho?",
        description: (
          <>
            O rascunho será descartado. Nada será publicado no Instagram.
            {preview ? (
              <span className="mt-2 block rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-sm text-foreground">
                “{preview}”
              </span>
            ) : null}
          </>
        ),
        confirmLabel: "Deletar",
        variant: "destructive",
      });

      if (!ok) {
        return;
      }

      setRemovingDraftId(commentId);
      try {
        await removeCommentDraft(commentId);
        if (selectedPostId) {
          await loadComments(selectedPostId, { silent: true, force: true });
        }
        toast.success("Rascunho deletado.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao remover rascunho.";
        toast.error(message);
      } finally {
        setRemovingDraftId(null);
      }
    },
    [comments, confirm, loadComments, selectedPostId],
  );

  const handleSaveDraft = useCallback(
    async (commentId: string, draftText: string) => {
      setSavingDraftId(commentId);
      try {
        await updateCommentDraft(commentId, draftText);
        if (selectedPostId) {
          await loadComments(selectedPostId, { silent: true, force: true });
        }
        toast.success("Rascunho salvo.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao salvar rascunho.";
        toast.error(message);
        throw err;
      } finally {
        setSavingDraftId(null);
      }
    },
    [loadComments, selectedPostId],
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
      postCacheRef.current.setComments(selectedPostId, result.comments, Date.now());
      setComments(result.comments);
      syncPostCountsFromComments(selectedPostId, result.comments);
      setSyncWarning(result.warning);
      await loadInsights(selectedPostId, { silent: true, force: true });

      const syncedAt = Date.now();
      postCacheRef.current.setLastSyncedAt(selectedPostId, syncedAt);
      setLastSyncedAt(syncedAt);
      toast.success("Publicação sincronizada com o Instagram.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao sincronizar publicação.";
      setError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }, [loadInsights, selectedPostId, syncPostCountsFromComments]);

  const handleReconcile = useCallback(async () => {
    if (!selectedPostId) {
      return;
    }

    setError("");

    try {
      const preview = await fetchReconcileCommentsPreview(selectedPostId);
      if (preview.linkable_count === 0) {
        toast.info("Nenhum comentário pendente para vincular a respostas já existentes no Instagram.");
        return;
      }

      const brandHandle = preview.brand_username
        ? `@${preview.brand_username}`
        : "a marca";

      const ok = await confirm({
        title: "Vincular respostas do Instagram?",
        description: (
          <>
            Encontramos <strong>{preview.linkable_count}</strong> comentário
            {preview.linkable_count === 1 ? "" : "s"} já respondido
            {preview.linkable_count === 1 ? "" : "s"} por {brandHandle} no Instagram. O Iris vai
            vincular cada um à resposta real do thread (texto e ID do comentário no IG), sem
            publicar nada novo.
          </>
        ),
        confirmLabel: "Vincular respostas",
      });

      if (!ok) {
        return;
      }

      setReconciling(true);
      const result = await reconcilePostComments(selectedPostId);
      const reconciledAt = Date.now();
      postCacheRef.current.setComments(selectedPostId, result.comments, reconciledAt);
      setComments(result.comments);
      syncPostCountsFromComments(selectedPostId, result.comments);
      toast.success(
        result.linked_count > 0
          ? `${result.linked_count} comentário${result.linked_count === 1 ? "" : "s"} vinculado${result.linked_count === 1 ? "" : "s"} à resposta existente no Instagram.`
          : "Nenhum comentário novo para vincular.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao vincular respostas do Instagram.";
      setError(message);
      toast.error(message);
    } finally {
      setReconciling(false);
    }
  }, [confirm, selectedPostId, syncPostCountsFromComments]);

  const handleSelectPost = useCallback(
    (postId: string) => {
      setSearchParams({ post_id: postId });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const cached = postCacheRef.current.getPosts();
    if (cached) {
      setPosts(cached.data);
      setLoadingPosts(false);
    }
    void loadPosts({ silent: Boolean(cached) });
  }, [loadPosts]);

  useEffect(() => {
    if (!selectedPostId && posts[0]) {
      setSearchParams({ post_id: posts[0].post_id });
    }
  }, [posts, selectedPostId, setSearchParams]);

  useEffect(() => {
    if (!selectedPostId) {
      setComments([]);
      setInsights(null);
      setLastSyncedAt(null);
      return;
    }

    const cachedComments = postCacheRef.current.getComments(selectedPostId);
    const cachedInsights = postCacheRef.current.getInsights(selectedPostId);
    const cachedLastSyncedAt = postCacheRef.current.getLastSyncedAt(selectedPostId) ?? null;

    if (cachedComments) {
      setComments(cachedComments.data);
    } else {
      setComments([]);
    }

    if (cachedInsights) {
      setInsights(cachedInsights.data);
    } else {
      setInsights(null);
    }

    setLastSyncedAt(cachedLastSyncedAt);

    void loadComments(selectedPostId, { silent: Boolean(cachedComments) });
    void loadInsights(selectedPostId, { silent: Boolean(cachedInsights) });
  }, [loadComments, loadInsights, selectedPostId]);

  useEffect(() => {
    const scheduleCommentsRefresh = (postId: string) => {
      if (commentsRefreshTimerRef.current) {
        clearTimeout(commentsRefreshTimerRef.current);
      }

      commentsRefreshTimerRef.current = setTimeout(() => {
        commentsRefreshTimerRef.current = null;
        void loadComments(postId, { silent: true });
      }, COMMENTS_REALTIME_DEBOUNCE_MS);
    };

    return subscribeRealtimeEvents({
      onConnectionChange: setLiveConnected,
      onCommentsChanged: (data) => {
        if (data.post_id && data.post_id === selectedPostId) {
          scheduleCommentsRefresh(selectedPostId);
        }
      },
    });
  }, [loadComments, selectedPostId]);

  useEffect(() => {
    if (!selectedPostId || liveConnected) {
      return;
    }

    const poll = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void loadComments(selectedPostId, { silent: true });
    };

    const intervalId = window.setInterval(poll, COMMENTS_FALLBACK_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [liveConnected, loadComments, selectedPostId]);

  useEffect(() => {
    return () => {
      if (commentsRefreshTimerRef.current) {
        clearTimeout(commentsRefreshTimerRef.current);
      }
    };
  }, []);

  return (
    <PageContainer variant="fill">
        {!meta?.connected && (
          <div className="shrink-0 border-b border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-6">
            Conecte o Instagram em{" "}
            <Link to="/settings" className="text-primary underline-offset-4 hover:underline">
              configurações
            </Link>{" "}
            para sincronizar comentários e atualizar insights.
          </div>
        )}

        {error ? (
          <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive sm:px-6">
            {error}
          </p>
        ) : null}

        {!liveConnected ? (
          <p className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 sm:px-6">
            Atualização em tempo real indisponível. A lista local será recarregada a cada minuto
            nesta aba, ou use o botão de sincronizar para buscar comentários no Instagram.
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card lg:flex-row">
          <aside
            className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-border lg:w-[340px] lg:max-w-[340px] lg:border-b-0 lg:border-r"
          >
            <div className="shrink-0 border-b p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-semibold leading-tight text-foreground">
                  Publicações
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="size-8 shrink-0"
                    onClick={() => setImportDialogOpen(true)}
                    disabled={!meta?.connected}
                    aria-label="Importar publicações"
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="size-8 shrink-0"
                    onClick={() => setAddDialogOpen(true)}
                    disabled={!meta?.connected}
                    aria-label="Adicionar publicação"
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="size-8 shrink-0"
                    onClick={() => void loadPosts({ force: true })}
                    disabled={refreshingPosts}
                    aria-label="Recarregar lista"
                  >
                    {refreshingPosts ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar legenda ou ID..."
                  className="h-10 border-border bg-muted/30 pl-10 text-sm focus-visible:ring-primary/40"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {loadingPosts ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Carregando…</p>
              ) : filteredPosts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  {posts.length === 0
                    ? "Nenhuma publicação gerenciada ainda."
                    : "Nada encontrado na busca."}
                </p>
              ) : (
                <PostInboxList
                  posts={filteredPosts}
                  selectedPostId={selectedPostId}
                  thumbnailOverrides={thumbnailOverrides}
                  onSelect={handleSelectPost}
                />
              )}
            </div>
          </aside>

          {selectedPost ? (
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <PostDetailPanel
                post={selectedPost}
                threadGroups={threadGroups}
                allComments={comments}
                brandUsername={meta?.igUsername}
                threadSort={threadSort}
                onThreadSortChange={setThreadSort}
                insights={insights}
                lastSyncedAt={lastSyncedAt}
                loadingComments={loadingComments}
                loadingInsights={loadingInsights}
                syncing={syncing}
                reconciling={reconciling}
                syncWarning={syncWarning}
                metaConnected={Boolean(meta?.connected)}
                approvingId={approvingId}
                removingDraftId={removingDraftId}
                savingDraftId={savingDraftId}
                generatingId={generatingId}
                onSync={() => void handleSync()}
                onReconcile={() => void handleReconcile()}
                onApproveDraft={(commentId, draftText) =>
                  void handleApproveDraft(commentId, draftText)
                }
                onRemoveDraft={(commentId) => void handleRemoveDraft(commentId)}
                onSaveDraft={(commentId, draftText) =>
                  handleSaveDraft(commentId, draftText)
                }
                onGenerateDraft={(commentId) => void handleGenerateDraft(commentId)}
                replyMode={selectedReplyMode}
                savingReplyMode={savingReplyMode}
                onReplyModeChange={(mode) => void handleReplyModeChange(mode)}
              />
            </section>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
              Selecione uma publicação na lista.
            </div>
          )}
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

      <ImportPostsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={() => {
          postCacheRef.current.invalidatePosts();
          void loadPosts({ force: true });
        }}
      />
    </PageContainer>
  );
}
