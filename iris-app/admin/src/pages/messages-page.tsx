import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Download,
  Loader2,
  PanelLeft,
  RefreshCw,
  Search,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ConversationDetailPanel } from "@/components/messages/conversation-detail-panel";
import { ConversationInboxList } from "@/components/messages/conversation-inbox-list";
import { MessageActivityPanel } from "@/components/messages/message-activity-panel";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { OpsEmptyState } from "@/components/templates/ops-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMetaSession } from "@/contexts/meta-session-context";
import { useConfirmDialog } from "@/contexts/confirm-dialog-context";
import { useAppRoutes } from "@/demo/demo-routes";
import { useDemoMode } from "@/demo/demo-mode-context";
import {
  approveMessageReply,
  fetchConversationMessages,
  fetchConversations,
  removeMessageDraft,
  replyToConversation,
  requestMessageAiReply,
  subscribeRealtimeEvents,
  syncConversationMessages,
  syncConversationsFromMeta,
  updateConversation,
  unlockConversationAi,
  updateMessageDraft,
} from "@/lib/api";
import type {
  ConversationReplyMode,
  ConversationSummary,
  Message,
  MessageActivityItem,
} from "@/lib/types";
import { countPendingInboundMessages } from "@/lib/message-pending";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const MESSAGES_FALLBACK_POLL_MS = 60_000;
const MESSAGES_REALTIME_DEBOUNCE_MS = 750;

type LeftPanelMode = "conversations" | "activity";

function messagesHaveChanged(current: Message[], next: Message[]): boolean {
  if (current.length !== next.length) {
    return true;
  }
  return next.some((message, index) => {
    const previous = current[index];
    if (!previous || previous.id !== message.id) {
      return true;
    }
    return (
      previous.status !== message.status ||
      previous.text !== message.text ||
      previous.draft_text !== message.draft_text ||
      previous.linked_reply_text !== message.linked_reply_text ||
      previous.attachment_url !== message.attachment_url
    );
  });
}

export function MessagesPage() {
  const { locale } = useAppLocale();
  const messagesMsg = useDomainMessages("messages");
  const routes = useAppRoutes();
  const { isDemoMode } = useDemoMode();
  const { meta } = useMetaSession();
  const { confirm } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConversationId = searchParams.get("conversation_id")?.trim() ?? "";
  const selectedMessageId = searchParams.get("message_id")?.trim() ?? "";

  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("conversations");
  const [activityRefreshToken, setActivityRefreshToken] = useState(0);
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshingConversations, setRefreshingConversations] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [error, setError] = useState("");
  const [liveConnected, setLiveConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMode, setReplyMode] = useState<ConversationReplyMode>("inherit");
  const [replyPrompt, setReplyPrompt] = useState("");
  const [savingReplyMode, setSavingReplyMode] = useState(false);
  const [savingBriefing, setSavingBriefing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [removingDraftId, setRemovingDraftId] = useState<string | null>(null);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sendingConversationReply, setSendingConversationReply] = useState(false);
  const [unlockingAi, setUnlockingAi] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return conversations;
    }
    return conversations.filter((conversation) => {
      const username = conversation.participant_username?.toLowerCase() ?? "";
      const displayName = conversation.participant_display_name?.toLowerCase() ?? "";
      const userId = conversation.participant_ig_user_id.toLowerCase();
      return (
        username.includes(query) ||
        displayName.includes(query) ||
        userId.includes(query)
      );
    });
  }, [conversations, searchQuery]);

  const loadConversations = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoadingConversations(true);
    } else {
      setRefreshingConversations(true);
    }
    setError("");
    try {
      const next = await fetchConversations();
      setConversations(next);
    } catch (err) {
      const message =
        getApiErrorMessage(err, locale) || messagesMsg.toasts.loadConversationsFailed;
      setError(message);
      if (!silent) {
        toast.error(message);
      }
    } finally {
      setLoadingConversations(false);
      setRefreshingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, options: { silent?: boolean } = {}) => {
      const { silent = false } = options;
      if (!silent) {
        setLoadingMessages(true);
      }
      try {
        const payload = await fetchConversationMessages(conversationId);
        const pendingCount = countPendingInboundMessages(payload.messages);
        const conversation = {
          ...payload.conversation,
          pending_count: pendingCount,
        };
        setMessages((current) =>
          messagesHaveChanged(current, payload.messages) ? payload.messages : current,
        );
        setReplyMode(conversation.reply_mode ?? "inherit");
        setReplyPrompt(conversation.reply_prompt ?? "");
        setConversations((current) =>
          current.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  ...conversation,
                  unread_count: 0,
                  pending_count: pendingCount,
                }
              : item,
          ),
        );
      } catch (err) {
        if (!silent) {
          toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.loadMessagesFailed);
        }
      } finally {
        setLoadingMessages(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  const scheduleRefresh = useCallback(
    (conversationId?: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        void loadConversations({ silent: true });
        if (conversationId) {
          void loadMessages(conversationId, { silent: true });
        }
        setActivityRefreshToken((value) => value + 1);
      }, MESSAGES_REALTIME_DEBOUNCE_MS);
    },
    [loadConversations, loadMessages],
  );

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents({
      onConnectionChange: setLiveConnected,
      onMessagesChanged: (data) => {
        scheduleRefresh(data.conversation_id);
      },
    });
    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    if (!selectedConversationId || liveConnected) {
      return;
    }

    const poll = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void loadConversations({ silent: true });
      void loadMessages(selectedConversationId, { silent: true });
    };

    const intervalId = window.setInterval(poll, MESSAGES_FALLBACK_POLL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [liveConnected, loadConversations, loadMessages, selectedConversationId]);

  const selectConversation = useCallback(
    (conversationId: string, messageId?: string) => {
      const params = new URLSearchParams();
      params.set("conversation_id", conversationId);
      if (messageId) {
        params.set("message_id", messageId);
      }
      setSearchParams(params);
      setListSheetOpen(false);
    },
    [setSearchParams],
  );

  const clearStage = useCallback(() => {
    setSearchParams({});
    setListSheetOpen(false);
  }, [setSearchParams]);

  function handleActivitySelect(item: MessageActivityItem) {
    selectConversation(item.conversation_id, item.message_id);
    setLeftPanelMode("conversations");
  }

  async function handleSyncInbox() {
    if (!meta?.connected || meta.messaging_supported === false) {
      toast.error(messagesMsg.toasts.connectForImport);
      return;
    }
    setSyncingInbox(true);
    try {
      const result = await syncConversationsFromMeta();
      await loadConversations({ silent: true });
      toast.success(
        result.synced > 0
          ? interpolate(messagesMsg.toasts.inboxSynced, { count: result.synced })
          : messagesMsg.toasts.inboxEmpty,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.importFailed);
    } finally {
      setSyncingInbox(false);
    }
  }

  async function handleSync() {
    if (!selectedConversationId) {
      return;
    }
    setSyncing(true);
    try {
      await syncConversationMessages(selectedConversationId);
      await loadMessages(selectedConversationId);
      toast.success(messagesMsg.toasts.conversationSynced);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.syncFailed);
    } finally {
      setSyncing(false);
    }
  }

  async function handleReplyModeChange(mode: ConversationReplyMode) {
    if (!selectedConversationId) {
      return;
    }
    setSavingReplyMode(true);
    try {
      const saved = await updateConversation(selectedConversationId, { reply_mode: mode });
      setReplyMode(saved.reply_mode);
      toast.success(messagesMsg.toasts.replyModeUpdated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.replyModeFailed);
    } finally {
      setSavingReplyMode(false);
    }
  }

  async function handleSaveBriefing() {
    if (!selectedConversationId) {
      return;
    }
    setSavingBriefing(true);
    try {
      await updateConversation(selectedConversationId, {
        reply_prompt: replyPrompt.trim() || null,
      });
      toast.success(messagesMsg.toasts.briefingSaved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.briefingFailed);
    } finally {
      setSavingBriefing(false);
    }
  }

  async function handleUnlockAi() {
    if (!selectedConversationId) {
      return;
    }
    setUnlockingAi(true);
    try {
      const saved = await unlockConversationAi(selectedConversationId);
      setConversations((current) =>
        current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)),
      );
      toast.success(messagesMsg.toasts.aiUnlocked);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.aiUnlockFailed);
    } finally {
      setUnlockingAi(false);
    }
  }

  const replaceMessage = useCallback((updated: Message) => {
    setMessages((current) => {
      const next = current.map((item) => (item.id === updated.id ? updated : item));
      setConversations((conversations) =>
        conversations.map((item) =>
          item.id === updated.conversation_id
            ? { ...item, pending_count: countPendingInboundMessages(next) }
            : item,
        ),
      );
      return next;
    });
  }, []);

  async function handleApproveDraft(messageId: string, draftText?: string | null) {
    setApprovingId(messageId);
    try {
      const updated = await approveMessageReply(
        messageId,
        draftText ?? undefined,
      );
      replaceMessage(updated);
      toast.success(messagesMsg.toasts.replySent);
      if (selectedConversationId) {
        await loadMessages(selectedConversationId, { silent: true });
        await loadConversations({ silent: true });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale));
    } finally {
      setApprovingId(null);
    }
  }

  const handleRemoveDraft = useCallback(
    async (messageId: string) => {
      const message = messages.find((item) => item.id === messageId);
      const preview = message?.draft_text?.trim()
        ? message.draft_text.trim().length > 120
          ? `${message.draft_text.trim().slice(0, 119)}…`
          : message.draft_text.trim()
        : null;

      const ok = await confirm({
        title: messagesMsg.confirm.deleteDraft.title,
        description: (
          <>
            {messagesMsg.confirm.deleteDraft.description}
            {preview ? (
              <span className="mt-2 block rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-sm text-foreground">
                “{preview}”
              </span>
            ) : null}
          </>
        ),
        confirmLabel: messagesMsg.confirm.deleteDraft.confirmLabel,
        variant: "destructive",
      });

      if (!ok) {
        return;
      }

      setRemovingDraftId(messageId);
      try {
        const updated = await removeMessageDraft(messageId);
        replaceMessage(updated);
        toast.success(messagesMsg.toasts.draftRemoved);
        if (selectedConversationId) {
          await loadMessages(selectedConversationId, { silent: true });
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.removeDraftFailed);
      } finally {
        setRemovingDraftId(null);
      }
    },
    [confirm, loadMessages, messages, replaceMessage, selectedConversationId],
  );

  async function handleSaveDraft(messageId: string, draftText: string) {
    setSavingDraftId(messageId);
    try {
      const updated = await updateMessageDraft(messageId, draftText);
      replaceMessage(updated);
      toast.success(messagesMsg.toasts.draftSaved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.saveDraftFailed);
      throw err;
    } finally {
      setSavingDraftId(null);
    }
  }

  async function handleGenerateDraft(messageId: string) {
    setGeneratingId(messageId);
    try {
      const updated = await requestMessageAiReply(messageId, "draft");
      replaceMessage(updated);
      toast.success(messagesMsg.toasts.draftGenerated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.generateDraftFailed);
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleConversationReply(text: string, replyToMessageId?: string | null) {
    if (!selectedConversationId) {
      return;
    }
    setSendingConversationReply(true);
    try {
      const outbound = await replyToConversation(
        selectedConversationId,
        text,
        replyToMessageId,
      );
      setMessages((current) => [...current, outbound]);
      await loadConversations({ silent: true });
      toast.success(messagesMsg.toasts.messageSent);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || messagesMsg.toasts.sendFailed);
    } finally {
      setSendingConversationReply(false);
    }
  }

  const inStage = Boolean(selectedConversationId);

  const pageHeader = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <PageContainer.Header
        eyebrow={messagesMsg.page.eyebrow}
        title={messagesMsg.page.title}
        description={messagesMsg.page.description}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 gap-1.5"
          disabled={
            syncingInbox || !meta?.connected || meta.messaging_supported === false
          }
          onClick={() => void handleSyncInbox()}
        >
          {syncingInbox ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="hidden sm:inline">{messagesMsg.page.import}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          onClick={() => void loadConversations({ silent: true })}
          disabled={refreshingConversations}
          aria-label={messagesMsg.page.reloadList}
        >
          {refreshingConversations ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );

  const listControls = (
    <div className="space-y-3">
      <div className="inline-flex w-fit max-w-full gap-1 rounded-full border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setLeftPanelMode("conversations")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm",
            leftPanelMode === "conversations"
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {messagesMsg.page.conversationsTab}
        </button>
        <button
          type="button"
          onClick={() => setLeftPanelMode("activity")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm",
            leftPanelMode === "activity"
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {messagesMsg.page.activityTab}
        </button>
      </div>

      {leftPanelMode === "conversations" ? (
        <div className="relative w-full min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={messagesMsg.page.searchPlaceholder}
            className="h-9 pl-10 text-sm focus-visible:ring-primary/40"
          />
        </div>
      ) : null}
    </div>
  );

  const listBody: ReactNode =
    leftPanelMode === "activity" ? (
      <MessageActivityPanel
        onSelect={handleActivitySelect}
        refreshToken={activityRefreshToken}
      />
    ) : loadingConversations ? (
      <OpsEmptyState>{messagesMsg.page.loadingConversations}</OpsEmptyState>
    ) : filteredConversations.length === 0 ? (
      <OpsEmptyState
        title={
          conversations.length === 0
            ? messagesMsg.empty.noConversationsTitle
            : messagesMsg.empty.noResultsTitle
        }
      >
        {conversations.length === 0
          ? meta?.connected
            ? messagesMsg.empty.noConversationsConnected
            : messagesMsg.empty.noConversationsDisconnected
          : messagesMsg.empty.noResultsBody}
      </OpsEmptyState>
    ) : (
      <ConversationInboxList
        conversations={filteredConversations}
        selectedId={selectedConversationId}
        brandUsername={meta?.igUsername}
        onSelect={(conversationId) => selectConversation(conversationId)}
      />
    );

  return (
    <PageContainer variant="fill">
      {!meta?.connected && (
        <div className="shrink-0 border-b border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-6">
          {messagesMsg.banners.connectInstagram.split("{settingsLink}")[0]}
          <Link
            to={routes.settings}
            className="text-primary underline-offset-4 hover:underline"
          >
            {messagesMsg.banners.settingsLink}
          </Link>{" "}
          {messagesMsg.banners.connectInstagram.split("{settingsLink}")[1]?.trimStart()}
        </div>
      )}

      {meta?.connected && meta.messaging_supported === false ? (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 sm:px-6">
          {messagesMsg.banners.messagingUnsupported}
        </div>
      ) : null}

      {error ? (
        <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive sm:px-6">
          {error}
        </p>
      ) : null}

      {!liveConnected && !isDemoMode ? (
        <p className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 sm:px-6">
          {messagesMsg.banners.realtimeUnavailable}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6">
          {pageHeader}
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              "flex min-h-0 flex-col border-border/60 md:w-[30%] md:min-w-70 md:max-w-sm md:shrink-0 md:border-r",
              inStage ? "hidden md:flex" : "flex w-full flex-1",
            )}
          >
            <div className="shrink-0 border-b border-border/60 p-3">{listControls}</div>
            <PageScrollArea className="min-h-0 flex-1 bg-transparent">
              {listBody}
            </PageScrollArea>
          </aside>

          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-col",
              inStage ? "flex w-full flex-1 md:w-[70%]" : "hidden md:flex md:flex-1",
            )}
          >
            {inStage ? (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2 md:hidden">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-10 gap-2"
                    onClick={clearStage}
                  >
                    <ArrowLeft className="size-4" />
                    {messagesMsg.page.back}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-10"
                    onClick={() => setListSheetOpen(true)}
                  >
                    <PanelLeft className="size-4" />
                  </Button>
                </div>

                {selectedConversation ? (
                  loadingMessages ? (
                    <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {messagesMsg.page.loadingMessages}
                    </div>
                  ) : (
                    <ConversationDetailPanel
                      conversation={selectedConversation}
                      messages={messages}
                      highlightMessageId={selectedMessageId || undefined}
                      brandUsername={meta?.igUsername}
                      metaReady={Boolean(meta?.connected)}
                      metaUnsupported={meta?.messaging_supported === false}
                      canReply={selectedConversation.can_reply !== false}
                      syncing={syncing}
                      savingReplyMode={savingReplyMode}
                      savingBriefing={savingBriefing}
                      approvingId={approvingId}
                      removingDraftId={removingDraftId}
                      savingDraftId={savingDraftId}
                      generatingId={generatingId}
                      replyMode={replyMode}
                      replyPrompt={replyPrompt}
                      onSync={() => void handleSync()}
                      onReplyModeChange={(mode) => void handleReplyModeChange(mode)}
                      onReplyPromptChange={setReplyPrompt}
                      onSaveBriefing={() => void handleSaveBriefing()}
                      onApproveDraft={(id, draft) => void handleApproveDraft(id, draft)}
                      onRemoveDraft={(id) => void handleRemoveDraft(id)}
                      onSaveDraft={handleSaveDraft}
                      onGenerateDraft={(id) => void handleGenerateDraft(id)}
                      onConversationReply={handleConversationReply}
                      onUnlockAi={() => void handleUnlockAi()}
                      unlockingAi={unlockingAi}
                      sendingConversationReply={sendingConversationReply}
                    />
                  )
                ) : (
                  <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                    {messagesMsg.page.loadingConversation}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                <OpsEmptyState title={messagesMsg.page.selectConversationTitle}>
                  {messagesMsg.page.selectConversationBody}
                </OpsEmptyState>
              </div>
            )}
          </main>
        </div>
      </div>

      <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle className="font-display text-lg font-semibold">
              {messagesMsg.page.sheetTitle}
            </SheetTitle>
          </SheetHeader>
          <div className="shrink-0 border-b p-3">{listControls}</div>
          <PageScrollArea className="flex-1">{listBody}</PageScrollArea>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
