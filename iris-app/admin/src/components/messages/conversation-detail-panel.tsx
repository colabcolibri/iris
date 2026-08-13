import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { MessageThread } from "@/components/messages/message-thread";
import {
  isWithinMessagingWindow,
  lastInboundMessage,
  messagingWindowLabel,
} from "@/lib/message-window";
import type { ConversationReplyMode, ConversationSummary, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConversationDetailPanelProps = {
  conversation: ConversationSummary;
  messages: Message[];
  brandUsername?: string | null;
  metaReady: boolean;
  metaUnsupported?: boolean;
  canReply?: boolean;
  syncing: boolean;
  savingReplyMode: boolean;
  savingBriefing: boolean;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  replyMode: ConversationReplyMode;
  replyPrompt: string;
  onSync: () => void;
  onReplyModeChange: (mode: ConversationReplyMode) => void;
  onReplyPromptChange: (value: string) => void;
  onSaveBriefing: () => void;
  onApproveDraft: (messageId: string, draftText?: string | null) => void;
  onRemoveDraft: (messageId: string) => void;
  onSaveDraft: (messageId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (messageId: string) => void;
  onManualReply: (messageId: string, text: string) => void | Promise<void>;
};

function formatHandle(username: string | null | undefined): string {
  const value = username?.trim() || "usuário";
  return value.startsWith("@") ? value : `@${value}`;
}

export function ConversationDetailPanel({
  conversation,
  messages,
  brandUsername,
  metaReady,
  metaUnsupported = false,
  canReply = true,
  syncing,
  savingReplyMode,
  savingBriefing,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  replyMode,
  replyPrompt,
  onSync,
  onReplyModeChange,
  onReplyPromptChange,
  onSaveBriefing,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  onManualReply,
}: ConversationDetailPanelProps) {
  const lastInbound = lastInboundMessage(messages);
  const windowOpen = isWithinMessagingWindow(
    lastInbound?.ig_timestamp ?? lastInbound?.created_at ?? null,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-4 border-b border-border/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {formatHandle(conversation.participant_username)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {conversation.participant_ig_user_id}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!metaReady || syncing || metaUnsupported}
            onClick={onSync}
          >
            {syncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Sincronizar
          </Button>
        </div>

        {metaUnsupported ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Conta Meta sem suporte a conversas via API. Conecte uma conta compatível
            para sincronizar e responder DMs.
          </p>
        ) : null}

        <div
          className={cn(
            "rounded-md border px-3 py-2 text-xs",
            windowOpen
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
          )}
        >
          {messagingWindowLabel(
            lastInbound?.ig_timestamp ?? lastInbound?.created_at ?? null,
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Modo de resposta</Label>
            <ReplyModeSelect
              variant="post"
              value={replyMode}
              disabled={savingReplyMode}
              onChange={(value) => onReplyModeChange(value as ConversationReplyMode)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Briefing da conversa</Label>
            <Textarea
              value={replyPrompt}
              onChange={(event) => onReplyPromptChange(event.target.value)}
              rows={3}
              placeholder="Contexto específico desta conversa…"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={savingBriefing}
              onClick={onSaveBriefing}
            >
              Salvar briefing
            </Button>
          </div>
        </div>

        {conversation.pending_count > 0 ? (
          <Badge variant="secondary">{conversation.pending_count} pendente(s)</Badge>
        ) : null}
      </div>

      <PageScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma mensagem nesta conversa. Use sincronizar para importar do Instagram.
          </p>
        ) : (
          <MessageThread
            messages={messages}
            brandUsername={brandUsername}
            canReply={canReply && !metaUnsupported}
            approvingId={approvingId}
            removingDraftId={removingDraftId}
            savingDraftId={savingDraftId}
            generatingId={generatingId}
            onApproveDraft={onApproveDraft}
            onRemoveDraft={onRemoveDraft}
            onSaveDraft={onSaveDraft}
            onGenerateDraft={onGenerateDraft}
            onManualReply={onManualReply}
          />
        )}
      </PageScrollArea>
    </div>
  );
}
