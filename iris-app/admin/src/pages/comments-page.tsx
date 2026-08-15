import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Download,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import { ImportPostsDialog } from "@/components/comments/import-posts-dialog";
import { CommentActivityPanel } from "@/components/comments/comment-activity-panel";
import { PostDetailPanel } from "@/components/comments/post-detail-panel";
import { PostInboxList } from "@/components/comments/post-inbox-list";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { OpsEmptyState } from "@/components/templates/ops-empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useMetaSession } from "@/contexts/meta-session-context";
import { useAppRoutes } from "@/demo/demo-routes";
import { useDemoMode } from "@/demo/demo-mode-context";
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
import type {
  Comment,
  CommentActivityItem,
  CommentPostSummary,
  PostInsightsResult,
  PostReplyModeSetting,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { interpolate } from "@/i18n/compose";
import { getPostReplyModeOptions } from "@/i18n/domains/labels/helpers";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { parseAgentActiveDaysInput } from "@/lib/parse-agent-active-days";
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

type LeftPanelMode = "posts" | "activity";

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
  const { locale } = useAppLocale();
  const commentsMsg = useDomainMessages("comments");
  const routes = useAppRoutes();
  const { isDemoMode } = useDemoMode();
  const { meta } = useMetaSession();
  const { confirm } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPostId = searchParams.get("post_id")?.trim() ?? "";
  const selectedCommentId = searchParams.get("comment_id")?.trim() ?? "";
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("posts");
  const [activityRefreshToken, setActivityRefreshToken] = useState(0);
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const [posts, setPosts] = useState<CommentPostSummary[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  /** Post cujos `comments` estão no state — evita validar comment_id no post anterior. */
  const [commentsPostId, setCommentsPostId] = useState("");
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
  const [agentActiveDays, setAgentActiveDays] = useState("");
  const [privateReplyMode, setPrivateReplyMode] =
    useState<PostReplyModeSetting>("inherit");
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [threadSort, setThreadSort] = useState<ThreadSortMode>("activity_desc");
  const [liveConnected, setLiveConnected] = useState(true);
  const [thumbnailOverrides, setThumbnailOverrides] = useState<
    Record<string, string>
  >({});
  const commentsRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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

  useEffect(() => {
    if (!selectedPost) {
      setAgentActiveDays("");
      setPrivateReplyMode("inherit");
      return;
    }
    setAgentActiveDays(
      selectedPost.agent_active_days != null
        ? String(selectedPost.agent_active_days)
        : "",
    );
    setPrivateReplyMode(selectedPost.private_reply_mode ?? "inherit");
  }, [
    selectedPost?.post_id,
    selectedPost?.agent_active_days,
    selectedPost?.private_reply_mode,
  ]);

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
    () =>
      sortCommentThreadGroups(buildCommentThreadGroups(comments), threadSort),
    [comments, threadSort],
  );

  const loadPosts = useCallback(
    async (options: { silent?: boolean; force?: boolean } = {}) => {
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
        setPosts((current) =>
          postsHaveChanged(current, nextPosts) ? nextPosts : current,
        );
        setThumbnailOverrides((current) => {
          const next: Record<string, string> = {};
          for (const [postId, url] of Object.entries(current)) {
            if (activePostIds.has(postId)) {
              next[postId] = url;
            }
          }
          return Object.keys(next).length === Object.keys(current).length
            ? current
            : next;
        });
        return nextPosts;
      } catch (err) {
        const message =
          getApiErrorMessage(err, locale) || commentsMsg.toasts.loadPostsFailed;
        setError(message);
        if (!silent) {
          toast.error(message);
        }
        return null;
      } finally {
        setLoadingPosts(false);
        setRefreshingPosts(false);
      }
    },
    [],
  );

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

  const showSkippedStaleToast = useCallback(
    (count: number | undefined) => {
      if (!count || count <= 0) {
        return;
      }

      toast.message(
        count === 1
          ? interpolate(commentsMsg.toasts.skippedStaleOne, { count })
          : interpolate(commentsMsg.toasts.skippedStaleOther, { count }),
      );
    },
    [commentsMsg.toasts.skippedStaleOne, commentsMsg.toasts.skippedStaleOther],
  );

  const loadComments = useCallback(
    async (
      postId: string,
      options: { silent?: boolean; force?: boolean } = {},
    ) => {
      const { silent = false, force = false } = options;
      if (!postId) {
        setComments([]);
        setCommentsPostId("");
        return;
      }

      const cached = postCacheRef.current.getComments(postId);
      if (cached) {
        setComments(cached.data);
        setCommentsPostId(postId);
      }

      if (
        !force &&
        cached &&
        isCacheFresh(cached.fetchedAt, COMMENTS_CACHE_STALE_MS)
      ) {
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
        setCommentsPostId(postId);
        syncPostCountsFromComments(postId, nextComments);
      } catch (err) {
        const message =
          getApiErrorMessage(err, locale) || commentsMsg.toasts.loadCommentsFailed;
        setError(message);
        toast.error(message);
      } finally {
        setLoadingComments(false);
      }
    },
    [syncPostCountsFromComments],
  );

  const loadInsights = useCallback(
    async (
      postId: string,
      options: { silent?: boolean; force?: boolean } = {},
    ) => {
      const { silent = false, force = false } = options;
      if (!postId || !meta?.connected) {
        setInsights(null);
        return;
      }

      const cached = postCacheRef.current.getInsights(postId);
      if (cached) {
        setInsights(cached.data);
      }

      if (
        !force &&
        cached &&
        isCacheFresh(cached.fetchedAt, INSIGHTS_CACHE_STALE_MS)
      ) {
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

        if (result.ig_media_status !== undefined) {
          setPosts((current) => {
            const patched = current.map((item) =>
              item.post_id === postId
                ? {
                    ...item,
                    ig_media_status:
                      result.ig_media_status ?? item.ig_media_status,
                    ig_media_status_detail:
                      result.ig_media_status_detail ??
                      item.ig_media_status_detail,
                  }
                : item,
            );
            const postsCache = postCacheRef.current.getPosts();
            if (postsCache) {
              postCacheRef.current.setPosts(patched, postsCache.fetchedAt);
            }
            return patched;
          });
        }

        const previewUrl = firstMediaSlideSrc(postId, result.media);
        if (previewUrl) {
          setThumbnailOverrides((current) =>
            current[postId] === previewUrl
              ? current
              : { ...current, [postId]: previewUrl },
          );
        }

        if (
          !result.ok &&
          result.message &&
          !silent &&
          !result.insights?.length
        ) {
          toast.error(result.message);
        }
      } catch (err) {
        const message =
          getApiErrorMessage(err, locale) || commentsMsg.toasts.loadInsightsFailed;
        const fallback = {
          ok: false,
          message,
          post_id: postId,
        } satisfies PostInsightsResult;
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
      toast.error(commentsMsg.toasts.mediaIdRequired);
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
      toast.success(commentsMsg.toasts.postAdded);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || commentsMsg.toasts.addPostFailed);
    } finally {
      setAddingPost(false);
    }
  }, [loadPosts, mediaInput, setSearchParams]);

  const bumpActivityRefresh = useCallback(() => {
    setActivityRefreshToken((current) => current + 1);
  }, []);

  const handleApproveDraft = useCallback(
    async (commentId: string, draftText?: string | null) => {
      setApprovingId(commentId);
      try {
        await approveCommentReply(commentId, draftText ?? undefined);
        if (selectedPostId) {
          await loadComments(selectedPostId, { silent: true, force: true });
        }
        toast.success(commentsMsg.toasts.replyPublished);
        bumpActivityRefresh();
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || commentsMsg.toasts.approveFailed);
      } finally {
        setApprovingId(null);
      }
    },
    [bumpActivityRefresh, loadComments, selectedPostId],
  );

  const handleGenerateDraft = useCallback(
    async (commentId: string) => {
      const comment = comments.find((item) => item.id === commentId);
      const preview = comment?.text?.trim()
        ? comment.text.trim().length > 120
          ? `${comment.text.trim().slice(0, 119)}…`
          : comment.text.trim()
        : commentsMsg.thread.noText;

      const ok = await confirm({
        title: commentsMsg.confirm.generateDraft.title,
        description: (
          <>
            {commentsMsg.confirm.generateDraft.description}
            {comment ? (
              <span className="mt-2 block rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-sm text-foreground">
                “{preview}”
              </span>
            ) : null}
          </>
        ),
        confirmLabel: commentsMsg.confirm.generateDraft.confirmLabel,
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
          toast.error(
            updated.error_message ?? commentsMsg.toasts.aiDraftFailed,
          );
          return;
        }
        toast.success(commentsMsg.toasts.draftGenerated);
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || commentsMsg.toasts.generateDraftFailed);
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
        toast.success(
          interpolate(commentsMsg.toasts.replyModeUpdated, {
            mode:
              getPostReplyModeOptions(locale)
                .find((option) => option.value === next)
                ?.label.toLowerCase() ?? next,
          }),
        );
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || commentsMsg.toasts.replyModeFailed);
      } finally {
        setSavingReplyMode(false);
      }
    },
    [selectedPost],
  );

  const patchSelectedPost = useCallback(
    (patch: Partial<CommentPostSummary>) => {
      if (!selectedPost) {
        return;
      }
      setPosts((current) => {
        const next = current.map((post) =>
          post.post_id === selectedPost.post_id ? { ...post, ...patch } : post,
        );
        const postsCache = postCacheRef.current.getPosts();
        if (postsCache) {
          postCacheRef.current.setPosts(next, postsCache.fetchedAt);
        }
        return next;
      });
    },
    [selectedPost],
  );

  const handlePrivateReplyModeChange = useCallback(
    async (next: PostReplyModeSetting) => {
      if (!selectedPost) {
        return;
      }

      setSavingCampaign(true);
      try {
        await updatePost(selectedPost.post_id, { private_reply_mode: next });
        setPrivateReplyMode(next);
        patchSelectedPost({ private_reply_mode: next });
        toast.success(
          interpolate(commentsMsg.toasts.privateReplyModeUpdated, {
            mode:
              getPostReplyModeOptions(locale)
                .find((option) => option.value === next)
                ?.label.toLowerCase() ?? next,
          }),
        );
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, locale) || commentsMsg.toasts.campaignFailed,
        );
      } finally {
        setSavingCampaign(false);
      }
    },
    [selectedPost, patchSelectedPost, commentsMsg, locale],
  );

  const handleAgentActiveDaysCommit = useCallback(async () => {
    if (!selectedPost) {
      return;
    }

    const parsed = parseAgentActiveDaysInput(agentActiveDays);
    const current =
      selectedPost.agent_active_days != null
        ? selectedPost.agent_active_days
        : null;
    if (parsed === current) {
      return;
    }

    setSavingCampaign(true);
    try {
      await updatePost(selectedPost.post_id, { agent_active_days: parsed });
      patchSelectedPost({ agent_active_days: parsed });
      toast.success(commentsMsg.toasts.campaignUpdated);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || commentsMsg.toasts.campaignFailed,
      );
      setAgentActiveDays(
        selectedPost.agent_active_days != null
          ? String(selectedPost.agent_active_days)
          : "",
      );
    } finally {
      setSavingCampaign(false);
    }
  }, [
    selectedPost,
    agentActiveDays,
    patchSelectedPost,
    commentsMsg,
    locale,
  ]);

  const handleRemoveDraft = useCallback(
    async (commentId: string) => {
      const comment = comments.find((item) => item.id === commentId);
      const preview = comment?.draft_text?.trim()
        ? comment.draft_text.trim().length > 120
          ? `${comment.draft_text.trim().slice(0, 119)}…`
          : comment.draft_text.trim()
        : null;

      const ok = await confirm({
        title: commentsMsg.confirm.deleteDraft.title,
        description: (
          <>
            {commentsMsg.confirm.deleteDraft.description}
            {preview ? (
              <span className="mt-2 block rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-sm text-foreground">
                “{preview}”
              </span>
            ) : null}
          </>
        ),
        confirmLabel: commentsMsg.confirm.deleteDraft.confirmLabel,
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
        toast.success(commentsMsg.toasts.draftDeleted);
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || commentsMsg.toasts.removeDraftFailed);
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
        toast.success(commentsMsg.toasts.draftSaved);
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || commentsMsg.toasts.saveDraftFailed);
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
      postCacheRef.current.setComments(
        selectedPostId,
        result.comments,
        Date.now(),
      );
      setComments(result.comments);
      setCommentsPostId(selectedPostId);
      syncPostCountsFromComments(selectedPostId, result.comments);
      setSyncWarning(result.warning);
      await loadInsights(selectedPostId, { silent: true, force: true });

      const syncedAt = Date.now();
      postCacheRef.current.setLastSyncedAt(selectedPostId, syncedAt);
      setLastSyncedAt(syncedAt);
      toast.success(commentsMsg.toasts.synced);
      showSkippedStaleToast(result.skipped_stale_count);
    } catch (err) {
      const message =
        getApiErrorMessage(err, locale) || commentsMsg.toasts.syncFailed;
      setError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }, [commentsMsg.toasts.syncFailed, commentsMsg.toasts.synced, loadInsights, selectedPostId, showSkippedStaleToast, syncPostCountsFromComments, locale]);

  const handleReconcile = useCallback(async () => {
    if (!selectedPostId) {
      return;
    }

    setError("");

    try {
      const preview = await fetchReconcileCommentsPreview(selectedPostId);
      const previewAt = Date.now();
      postCacheRef.current.setComments(
        selectedPostId,
        preview.comments,
        previewAt,
      );
      setComments(preview.comments);
      setCommentsPostId(selectedPostId);
      syncPostCountsFromComments(selectedPostId, preview.comments);
      if (preview.marked_deleted > 0) {
        toast.info(
          interpolate(commentsMsg.toasts.markedDeleted, {
            count: preview.marked_deleted,
          }),
        );
      }
      if (preview.warning) {
        setSyncWarning(preview.warning);
      }

      if (preview.linkable_count === 0) {
        toast.info(
          preview.marked_deleted > 0
            ? commentsMsg.toasts.reconcileUpdated
            : commentsMsg.toasts.reconcileNothingPending,
        );
        return;
      }

      const brandHandle = preview.brand_username
        ? `@${preview.brand_username}`
        : "a marca";

      const ok = await confirm({
        title: commentsMsg.confirm.reconcile.title,
        description: (
          <>
            {interpolate(commentsMsg.confirm.reconcile.description, {
              count: preview.linkable_count,
              brand: brandHandle,
            })}
          </>
        ),
        confirmLabel: commentsMsg.confirm.reconcile.confirmLabel,
      });

      if (!ok) {
        return;
      }

      setReconciling(true);
      const result = await reconcilePostComments(selectedPostId);
      const reconciledAt = Date.now();
      postCacheRef.current.setComments(
        selectedPostId,
        result.comments,
        reconciledAt,
      );
      setComments(result.comments);
      setCommentsPostId(selectedPostId);
      syncPostCountsFromComments(selectedPostId, result.comments);
      if (result.warning) {
        setSyncWarning(result.warning);
      }
      const deletedNote =
        result.marked_deleted > 0
          ? interpolate(commentsMsg.toasts.deletedOnIg, {
              count: result.marked_deleted,
            })
          : "";
      toast.success(
        result.linked_count > 0
          ? interpolate(commentsMsg.toasts.linked, {
              count: result.linked_count,
              deletedNote,
            })
          : interpolate(commentsMsg.toasts.linkedNone, { deletedNote }),
      );
      showSkippedStaleToast(result.skipped_stale_count);
    } catch (err) {
      const message =
        getApiErrorMessage(err, locale) || commentsMsg.toasts.reconcileFailed;
      setError(message);
      toast.error(message);
    } finally {
      setReconciling(false);
    }
  }, [commentsMsg, confirm, locale, selectedPostId, showSkippedStaleToast, syncPostCountsFromComments]);

  const handleSelectPost = useCallback(
    (postId: string) => {
      setSearchParams({ post_id: postId });
      setListSheetOpen(false);
    },
    [setSearchParams],
  );

  const handleActivitySelect = useCallback(
    (item: CommentActivityItem) => {
      setSearchParams({ post_id: item.post_id, comment_id: item.comment_id });
      setListSheetOpen(false);
    },
    [setSearchParams],
  );

  const clearStage = useCallback(() => {
    setSearchParams({});
    setListSheetOpen(false);
  }, [setSearchParams]);

  useEffect(() => {
    const cached = postCacheRef.current.getPosts();
    if (cached) {
      setPosts(cached.data);
      setLoadingPosts(false);
    }
    void loadPosts({ silent: Boolean(cached) });
  }, [loadPosts]);

  useEffect(() => {
    if (!selectedCommentId || loadingComments) {
      return;
    }

    // Só valida depois que `comments` for da publicação da URL — senão o clique
    // na atividade dispara erro com a lista do post anterior ainda no state.
    if (!selectedPostId || commentsPostId !== selectedPostId) {
      return;
    }

    if (comments.length === 0) {
      return;
    }

    const exists = comments.some((comment) => comment.id === selectedCommentId);
    if (!exists) {
      toast.error(commentsMsg.toasts.commentNotFound);
      setSearchParams({ post_id: selectedPostId }, { replace: true });
    }
  }, [
    comments,
    commentsPostId,
    loadingComments,
    selectedCommentId,
    selectedPostId,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!selectedPostId) {
      setComments([]);
      setCommentsPostId("");
      setInsights(null);
      setLastSyncedAt(null);
      return;
    }

    const cachedComments = postCacheRef.current.getComments(selectedPostId);
    const cachedInsights = postCacheRef.current.getInsights(selectedPostId);
    const cachedLastSyncedAt =
      postCacheRef.current.getLastSyncedAt(selectedPostId) ?? null;

    if (cachedComments) {
      setComments(cachedComments.data);
      setCommentsPostId(selectedPostId);
    } else {
      setComments([]);
      setCommentsPostId(selectedPostId);
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
        bumpActivityRefresh();
        if (data.post_id && data.post_id === selectedPostId) {
          scheduleCommentsRefresh(selectedPostId);
        }
      },
    });
  }, [bumpActivityRefresh, loadComments, selectedPostId]);

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

  const inStage = Boolean(selectedPost);

  const listChrome = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageContainer.Header
          eyebrow={commentsMsg.page.eyebrow}
          title={leftPanelMode === "posts" ? commentsMsg.page.postsTitle : commentsMsg.page.activityTitle}
          description={
            leftPanelMode === "posts"
              ? commentsMsg.page.postsDescription
              : commentsMsg.page.activityDescription
          }
        />
        {leftPanelMode === "posts" ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 gap-1.5"
              onClick={() => setImportDialogOpen(true)}
              disabled={!meta?.connected}
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">{commentsMsg.page.import}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 gap-1.5"
              onClick={() => setAddDialogOpen(true)}
              disabled={!meta?.connected}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">{commentsMsg.page.add}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0"
              onClick={() => void loadPosts({ force: true })}
              disabled={refreshingPosts}
              aria-label={commentsMsg.page.reloadList}
            >
              {refreshingPosts ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit max-w-full gap-1 rounded-full border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setLeftPanelMode("posts")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              leftPanelMode === "posts"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {commentsMsg.page.postsTab}
          </button>
          <button
            type="button"
            onClick={() => setLeftPanelMode("activity")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              leftPanelMode === "activity"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {commentsMsg.page.activityTab}
          </button>
        </div>

        {leftPanelMode === "posts" ? (
          <div className="relative w-full min-w-0 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={commentsMsg.page.searchPlaceholder}
              className="h-10 pl-10 text-sm focus-visible:ring-primary/40"
            />
          </div>
        ) : null}
      </div>
    </div>
  );

  const listBody: ReactNode =
    leftPanelMode === "activity" ? (
      <CommentActivityPanel
        onSelect={handleActivitySelect}
        refreshToken={activityRefreshToken}
      />
    ) : loadingPosts ? (
      <OpsEmptyState>{commentsMsg.page.loadingPosts}</OpsEmptyState>
    ) : filteredPosts.length === 0 ? (
      <OpsEmptyState
        title={
          posts.length === 0
            ? commentsMsg.empty.noPostsTitle
            : commentsMsg.empty.noResultsTitle
        }
      >
        {posts.length === 0
          ? commentsMsg.empty.noPostsBody
          : commentsMsg.empty.noResultsBody}
      </OpsEmptyState>
    ) : (
      <PostInboxList
        posts={filteredPosts}
        selectedPostId={selectedPostId}
        thumbnailOverrides={thumbnailOverrides}
        onSelect={handleSelectPost}
      />
    );

  return (
    <PageContainer variant="fill">
      {!meta?.connected && (
        <div className="shrink-0 border-b border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-6">
          {interpolate(commentsMsg.banners.connectInstagram, {
            settingsLink: "",
          }).split("{settingsLink}")[0]}
          <Link
            to={routes.settings}
            className="text-primary underline-offset-4 hover:underline"
          >
            {commentsMsg.banners.settingsLink}
          </Link>{" "}
          {interpolate(commentsMsg.banners.connectInstagram, {
            settingsLink: "",
          }).split("{settingsLink}")[1]?.trimStart()}
        </div>
      )}

      {error ? (
        <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive sm:px-6">
          {error}
        </p>
      ) : null}

      {!liveConnected && !isDemoMode ? (
        <p className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 sm:px-6">
          {commentsMsg.banners.realtimeUnavailable}
        </p>
      ) : null}

      {!inStage ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-4 sm:px-6 md:px-8">
            {listChrome}
          </div>
          <PageScrollArea className="bg-transparent">{listBody}</PageScrollArea>
        </div>
      ) : selectedPost ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 gap-2"
              onClick={clearStage}
            >
              <ArrowLeft className="size-4" />
              {commentsMsg.page.backToAll}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 gap-2"
              onClick={() => setListSheetOpen(true)}
            >
              <PanelLeft className="size-4" />
              {commentsMsg.page.list}
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {selectedPost.caption?.trim() ||
                selectedPost.ig_media_id ||
                selectedPost.post_id}
            </p>
          </div>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <PostDetailPanel
              post={selectedPost}
              threadGroups={threadGroups}
              allComments={comments}
              brandUsername={meta?.igUsername}
              focusCommentId={selectedCommentId || null}
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
              onGenerateDraft={(commentId) =>
                void handleGenerateDraft(commentId)
              }
              replyMode={selectedReplyMode}
              savingReplyMode={savingReplyMode}
              onReplyModeChange={(mode) => void handleReplyModeChange(mode)}
              agentActiveDays={agentActiveDays}
              privateReplyMode={privateReplyMode}
              savingCampaign={savingCampaign}
              onAgentActiveDaysChange={setAgentActiveDays}
              onAgentActiveDaysCommit={() => void handleAgentActiveDaysCommit()}
              onPrivateReplyModeChange={(mode) =>
                void handlePrivateReplyModeChange(mode)
              }
            />
          </section>

          <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
            <SheetContent
              side="left"
              className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b border-border">
                <SheetTitle className="font-display text-lg font-semibold">
                  {commentsMsg.page.sheetTitle}
                </SheetTitle>
              </SheetHeader>
              <div className="shrink-0 border-b p-4">{listChrome}</div>
              <PageScrollArea>{listBody}</PageScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          {commentsMsg.page.loadingPost}
        </div>
      )}

      {addDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md space-y-4 p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{commentsMsg.addDialog.title}</h2>
              <p className="text-sm text-muted-foreground">
                {commentsMsg.addDialog.description}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monitored-media-input">
                {commentsMsg.addDialog.fieldLabel}
              </Label>
              <Input
                id="monitored-media-input"
                value={mediaInput}
                onChange={(e) => setMediaInput(e.target.value)}
                placeholder={commentsMsg.addDialog.fieldPlaceholder}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                {commentsMsg.addDialog.cancel}
              </Button>
              <Button
                type="button"
                onClick={() => void handleAddMonitoredPost()}
                disabled={addingPost}
              >
                {addingPost ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {addingPost ? commentsMsg.addDialog.adding : commentsMsg.addDialog.submit}
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
