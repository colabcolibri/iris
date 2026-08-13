import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, PanelLeft, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
    try {
      const next = await fetchConversations();
      setConversations(next);
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Falha ao carregar conversas.");
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
      onMessagesChanged: (data) => {
        scheduleRefresh(data.conversation_id);
      },
    });
    const poll = setInterval(() => {
      void loadConversations({ silent: true });
      if (selectedConversationId) {
        void loadMessages(selectedConversationId, { silent: true });
      }
    }, MESSAGES_FALLBACK_POLL_MS);
    return () => {
      unsubscribe();
      clearInterval(poll);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [loadConversations, loadMessages, scheduleRefresh, selectedConversationId]);

  function selectConversation(conversationId: string, messageId?: string) {
    const params = new URLSearchParams();
    params.set("conversation_id", conversationId);
    if (messageId) {
      params.set("message_id", messageId);
    }
    setSearchParams(params);
    setListSheetOpen(false);
  }

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

  const leftPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-border/60 p-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
          {(
            [
              ["conversations", "Conversas"],
              ["activity", "Atividade"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLeftPanelMode(mode)}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                leftPanelMode === mode
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {leftPanelMode === "conversations" ? (
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar conversa…"
          />
        ) : null}
      </div>
      {leftPanelMode === "activity" ? (
        <MessageActivityPanel
          onSelect={handleActivitySelect}
          refreshToken={activityRefreshToken}
        />
      ) : loadingConversations ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando…
        </div>
      ) : filteredConversations.length === 0 ? (
        <OpsEmptyState title="Nenhuma conversa">
          {meta?.connected
            ? "Use Importar para puxar DMs do Instagram ou aguarde novas mensagens via webhook."
            : "Conecte o Instagram em Configurações para importar DMs."}
        </OpsEmptyState>
      ) : (
        <PageScrollArea>
          <ConversationInboxList
            conversations={filteredConversations}
            selectedId={selectedConversationId}
            onSelect={(conversationId) => selectConversation(conversationId)}
          />
        </PageScrollArea>
      )}
    </div>
  );

  return (
    <PageContainer variant="fill">
      <PageContainer.Content className="flex min-h-0 flex-1 flex-col gap-0 p-0">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden w-full max-w-md shrink-0 border-r border-border/60 md:flex md:flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <h1 className="text-base font-semibold">Mensagens</h1>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={syncingInbox || !meta?.connected || meta.messaging_supported === false}
                  onClick={() => void handleSyncInbox()}
                >
                  {syncingInbox ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Importar
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={refreshingConversations}
                  onClick={() => void loadConversations({ silent: true })}
                >
                  <RefreshCw
                    className={cn("size-4", refreshingConversations && "animate-spin")}
                  />
                </Button>
              </div>
            </div>
            {leftPanel}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            {inStage && selectedConversation ? (
              <>
                <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 md:hidden">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setListSheetOpen(true)}
                  >
                    <PanelLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchParams(new URLSearchParams())}
                  >
                    <ArrowLeft className="size-4" />
                    Voltar
                  </Button>
                </div>
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
                    canReply={selectedConversation?.can_reply !== false}
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
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <OpsEmptyState title="Selecione uma conversa">
                  Escolha uma DM na lista ou abra um item da atividade.
                </OpsEmptyState>
                <Button
                  type="button"
                  className="md:hidden"
                  variant="outline"
                  onClick={() => setListSheetOpen(true)}
                >
                  <PanelLeft className="size-4" />
                  Abrir lista
                </Button>
              </div>
            )}
          </main>
        </div>

        <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
          <SheetContent side="left" className="flex w-full max-w-md flex-col p-0">
            <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
              <SheetTitle>Mensagens</SheetTitle>
            </SheetHeader>
            {leftPanel}
          </SheetContent>
        </Sheet>
      </PageContainer.Content>
    </PageContainer>
  );
}
