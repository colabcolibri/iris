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
import { useAppRoutes } from "@/demo/demo-routes";
import { useDemoMode } from "@/demo/demo-mode-context";
import {
  approveMessageReply,
  fetchConversationMessages,
  fetchConversations,
  removeMessageDraft,
  replyToMessage,
  requestMessageAiReply,
  subscribeRealtimeEvents,
  syncConversationMessages,
  syncConversationsFromMeta,
  updateConversation,
  updateMessageDraft,
} from "@/lib/api";
import type {
  ConversationReplyMode,
  ConversationSummary,
  Message,
  MessageActivityItem,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MESSAGES_FALLBACK_POLL_MS = 60_000;
const MESSAGES_REALTIME_DEBOUNCE_MS = 750;

type LeftPanelMode = "conversations" | "activity";

function formatHandle(username: string | null | undefined): string {
  const value = username?.trim() || "usuário";
  return value.startsWith("@") ? value : `@${value}`;
}

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
      previous.linked_reply_text !== message.linked_reply_text
    );
  });
}

export function MessagesPage() {
  const routes = useAppRoutes();
  const { isDemoMode } = useDemoMode();
  const { meta } = useMetaSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConversationId = searchParams.get("conversation_id")?.trim() ?? "";
  const selectedMessageId = searchParams.get("message_id")?.trim() ?? "";

  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("conversations");
  const [activityRefreshToken, setActivityRefreshToken] = useState(0);
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesConversationId, setMessagesConversationId] = useState("");
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
      const userId = conversation.participant_ig_user_id.toLowerCase();
      return username.includes(query) || userId.includes(query);
    });
  }, [conversations, searchQuery]);

  const inStage = Boolean(selectedConversationId);

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
        err instanceof Error ? err.message : "Falha ao carregar conversas.";
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
        setMessages((current) =>
          messagesHaveChanged(current, payload.messages) ? payload.messages : current,
        );
        setMessagesConversationId(conversationId);
        setReplyMode(payload.conversation.reply_mode ?? "inherit");
        setReplyPrompt(payload.conversation.reply_prompt ?? "");
        setConversations((current) =>
          current.map((item) =>
            item.id === conversationId ? { ...item, ...payload.conversation } : item,
          ),
        );
      } catch (err) {
        if (!silent) {
          toast.error(err instanceof Error ? err.message : "Falha ao carregar mensagens.");
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
    if (!meta?.connected || meta.messaging_supported === false) {
      return;
    }
    let cancelled = false;
    setSyncingInbox(true);
    void syncConversationsFromMeta()
      .then(() => {
        if (!cancelled) {
          return loadConversations({ silent: true });
        }
        return undefined;
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Falha ao importar conversas do Instagram.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSyncingInbox(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadConversations, meta?.connected, meta?.messaging_supported]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setMessagesConversationId("");
      return;
    }
    void loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    if (!selectedMessageId || messagesConversationId !== selectedConversationId) {
      return;
    }
    const element = document.getElementById(`message-${selectedMessageId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [messages, messagesConversationId, selectedConversationId, selectedMessageId]);

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
      toast.error("Conecte uma conta Instagram com Page para importar DMs.");
      return;
    }
    setSyncingInbox(true);
    try {
      const result = await syncConversationsFromMeta();
      await loadConversations({ silent: true });
      toast.success(
        result.synced > 0
          ? `${result.synced} conversa(s) sincronizada(s) do Instagram.`
          : "Nenhuma conversa nova encontrada no Instagram.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao importar conversas do Instagram.",
      );
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
      toast.success("Conversa sincronizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao sincronizar.");
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
      toast.success("Modo de resposta atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar modo.");
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
      toast.success("Briefing salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar briefing.");
    } finally {
      setSavingBriefing(false);
    }
  }

  const replaceMessage = useCallback((updated: Message) => {
    setMessages((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  async function handleApproveDraft(messageId: string, draftText?: string | null) {
    setApprovingId(messageId);
    try {
      const updated = await approveMessageReply(
        messageId,
        draftText ?? undefined,
      );
      replaceMessage(updated);
      toast.success("Resposta enviada na Meta.");
      if (selectedConversationId) {
        await loadMessages(selectedConversationId, { silent: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao aprovar.");
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRemoveDraft(messageId: string) {
    setRemovingDraftId(messageId);
    try {
      const updated = await removeMessageDraft(messageId);
      replaceMessage(updated);
      toast.success("Rascunho removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover rascunho.");
    } finally {
      setRemovingDraftId(null);
    }
  }

  async function handleSaveDraft(messageId: string, draftText: string) {
    setSavingDraftId(messageId);
    try {
      const updated = await updateMessageDraft(messageId, draftText);
      replaceMessage(updated);
      toast.success("Rascunho salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar rascunho.");
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
      toast.success("Rascunho gerado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar rascunho.");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleManualReply(messageId: string, text: string) {
    try {
      const updated = await replyToMessage(messageId, text);
      replaceMessage(updated);
      toast.success("Mensagem enviada.");
      if (selectedConversationId) {
        await loadMessages(selectedConversationId, { silent: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar.");
    }
  }

  const listChrome = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageContainer.Header
          eyebrow="Operação"
          title={leftPanelMode === "conversations" ? "Mensagens" : "Atividade"}
          description={
            leftPanelMode === "conversations"
              ? "Escolha uma conversa para ver o histórico, responder e configurar o modo de resposta."
              : "Mensagens recentes em todas as conversas do Instagram."
          }
        />
        {leftPanelMode === "conversations" ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 gap-1.5"
              disabled={
                syncingInbox ||
                !meta?.connected ||
                meta.messaging_supported === false
              }
              onClick={() => void handleSyncInbox()}
            >
              {syncingInbox ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0"
              onClick={() => void loadConversations({ silent: true })}
              disabled={refreshingConversations}
              aria-label="Recarregar lista"
            >
              {refreshingConversations ? (
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
            onClick={() => setLeftPanelMode("conversations")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              leftPanelMode === "conversations"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Conversas
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
            Atividade
          </button>
        </div>

        {leftPanelMode === "conversations" ? (
          <div className="relative w-full min-w-0 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar usuário ou ID…"
              className="h-10 pl-10 text-sm focus-visible:ring-primary/40"
            />
          </div>
        ) : null}
      </div>
    </div>
  );

  const listBody: ReactNode =
    leftPanelMode === "activity" ? (
      <MessageActivityPanel
        onSelect={handleActivitySelect}
        refreshToken={activityRefreshToken}
      />
    ) : loadingConversations ? (
      <OpsEmptyState>Carregando conversas…</OpsEmptyState>
    ) : filteredConversations.length === 0 ? (
      <OpsEmptyState
        title={
          conversations.length === 0 ? "Nenhuma conversa ainda" : "Nada encontrado"
        }
      >
        {conversations.length === 0
          ? meta?.connected
            ? "Use Importar para puxar DMs do Instagram ou aguarde novas mensagens via webhook."
            : "Conecte o Instagram em Configurações para importar DMs."
          : "Tente outra busca por usuário ou ID."}
      </OpsEmptyState>
    ) : (
      <ConversationInboxList
        conversations={filteredConversations}
        selectedId={selectedConversationId}
        onSelect={(conversationId) => selectConversation(conversationId)}
      />
    );

  return (
    <PageContainer variant="fill">
      {!meta?.connected && (
        <div className="shrink-0 border-b border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-6">
          Conecte o Instagram em{" "}
          <Link
            to={routes.settings}
            className="text-primary underline-offset-4 hover:underline"
          >
            configurações
          </Link>{" "}
          para importar DMs e sincronizar conversas.
        </div>
      )}

      {meta?.connected && meta.messaging_supported === false ? (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 sm:px-6">
          Mensagens diretas exigem uma Page do Facebook vinculada à conta
          Instagram. Revise a conexão em configurações.
        </div>
      ) : null}

      {error ? (
        <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive sm:px-6">
          {error}
        </p>
      ) : null}

      {!liveConnected && !isDemoMode ? (
        <p className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100 sm:px-6">
          Atualização em tempo real indisponível. A lista será recarregada a cada
          minuto nesta aba, ou use Importar para buscar conversas no Instagram.
        </p>
      ) : null}

      {!inStage ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-4 sm:px-6 md:px-8">{listChrome}</div>
          <PageScrollArea className="bg-transparent">{listBody}</PageScrollArea>
        </div>
      ) : selectedConversation ? (
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
              Todas as conversas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 gap-2"
              onClick={() => setListSheetOpen(true)}
            >
              <PanelLeft className="size-4" />
              Lista
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {formatHandle(selectedConversation.participant_username)}
            </p>
          </div>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {loadingMessages ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando mensagens…
              </div>
            ) : (
              <ConversationDetailPanel
                conversation={selectedConversation}
                messages={messages}
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
                onManualReply={handleManualReply}
              />
            )}
          </section>

          <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
            <SheetContent
              side="left"
              className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b border-border">
                <SheetTitle className="font-display text-lg font-semibold">
                  Mensagens
                </SheetTitle>
              </SheetHeader>
              <div className="shrink-0 border-b p-4">{listChrome}</div>
              <PageScrollArea>{listBody}</PageScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          Carregando conversa…
        </div>
      )}
    </PageContainer>
  );
}
