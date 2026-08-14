import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParticipantAvatar } from "@/components/messages/participant-avatar";
import { ConversationSettingsSheet } from "@/components/messages/conversation-settings-sheet";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import {
  ConversationComposer,
  type ConversationComposerMode,
} from "@/components/messages/conversation-composer";
import { quotedMessagePreview } from "@/lib/message-quote";
import { MessageThread } from "@/components/messages/message-thread";
import {
  formatParticipantHandle,
  participantDisplayLabel,
  resolveParticipantForDisplay,
} from "@/lib/participant-display";
import { countPendingInboundMessages } from "@/lib/message-pending";
import {
  isWithinMessagingWindow,
  lastInboundMessage,
  messagingWindowLabel,
} from "@/lib/message-window";
import { interpolate } from "@/i18n/compose";
import { useDomainMessages } from "@/i18n/provider";
import type { ConversationReplyMode, ConversationSummary, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConversationDetailPanelProps = {
  conversation: ConversationSummary;
  messages: Message[];
  highlightMessageId?: string;
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
  onConversationReply: (
    text: string,
    replyToMessageId?: string | null,
  ) => void | Promise<void>;
  onUnlockAi?: () => void | Promise<void>;
  unlockingAi?: boolean;
  sendingConversationReply?: boolean;
};

export function ConversationDetailPanel({
  conversation,
  messages,
  highlightMessageId,
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
  onConversationReply,
  onUnlockAi,
  unlockingAi = false,
  sendingConversationReply = false,
}: ConversationDetailPanelProps) {
  const detail = useDomainMessages("messages").detail;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ConversationComposerMode>({
    kind: "free",
  });
  const threadViewportRef = useRef<HTMLDivElement>(null);
  const lastInbound = lastInboundMessage(messages);
  const windowOpen = isWithinMessagingWindow(
    lastInbound?.ig_timestamp ?? lastInbound?.created_at ?? null,
  );
  const participant = resolveParticipantForDisplay(
    conversation.participant_username,
    conversation.participant_display_name,
    brandUsername,
  );
  const participantLabel = participantDisplayLabel(
    participant.username,
    participant.displayName,
  );
  const participantHandle = formatParticipantHandle(participant.username);
  const pendingReplyCount = countPendingInboundMessages(messages);
  const replyEnabled = canReply && !metaUnsupported;

  useEffect(() => {
    setComposerMode({ kind: "free" });
  }, [conversation.id]);

  useEffect(() => {
    const viewport = threadViewportRef.current;
    if (!viewport || messages.length === 0) {
      return;
    }

    const scrollToTarget = () => {
      if (highlightMessageId) {
        const target = viewport.querySelector(
          `#message-${CSS.escape(highlightMessageId)}`,
        );
        if (target) {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
          return;
        }
      }

      viewport.scrollTop = viewport.scrollHeight;
    };

    scrollToTarget();
    const frame = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frame);
  }, [conversation.id, highlightMessageId, messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <ParticipantAvatar
            username={participant.username}
            displayName={participant.displayName}
            avatarUrl={conversation.participant_avatar_url}
            className="size-10 shrink-0 sm:size-11"
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {participantLabel}
              </h2>
              {pendingReplyCount > 0 ? (
                <Badge variant="outline" className="shrink-0 px-1.5 text-xs">
                  {interpolate(detail.pendingBadge, {
                    count: pendingReplyCount,
                  })}
                </Badge>
              ) : null}
              {conversation.ai_locked ? (
                <Badge variant="secondary" className="shrink-0 px-1.5 text-xs">
                  {detail.aiLockedBadge}
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {participant.username
                ? participantHandle
                : conversation.participant_ig_user_id}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                "hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex",
                windowOpen
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-100"
                  : "bg-amber-500/15 text-amber-900 dark:text-amber-100",
              )}
              title={messagingWindowLabel(
                lastInbound?.ig_timestamp ?? lastInbound?.created_at ?? null,
              )}
            >
              {windowOpen ? detail.windowOpen : detail.windowClosed}
            </span>
            {conversation.ai_locked && onUnlockAi ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="hidden h-8 shrink-0 sm:inline-flex"
                aria-label={detail.unlockAiAria}
                disabled={unlockingAi}
                onClick={() => void onUnlockAi()}
              >
                {unlockingAi ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                {detail.unlockAi}
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9"
              aria-label={detail.settingsAria}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-9"
              disabled={!metaReady || syncing || metaUnsupported}
              aria-label={detail.syncAria}
              onClick={onSync}
            >
              {syncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {metaUnsupported ? (
          <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {detail.metaUnsupported}
          </p>
        ) : null}
      </div>

      <PageScrollArea
        className="min-h-0 flex-1 overflow-x-hidden"
        contentClassName="p-3 sm:p-4"
        scrollViewportRef={threadViewportRef}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{detail.emptyMessages}</p>
        ) : (
          <MessageThread
            messages={messages}
            brandUsername={brandUsername}
            participantUsername={participant.username}
            participantDisplayName={participant.displayName}
            participantAvatarUrl={conversation.participant_avatar_url}
            canReply={replyEnabled}
            approvingId={approvingId}
            removingDraftId={removingDraftId}
            savingDraftId={savingDraftId}
            generatingId={generatingId}
            onApproveDraft={onApproveDraft}
            onRemoveDraft={onRemoveDraft}
            onSaveDraft={onSaveDraft}
            onGenerateDraft={onGenerateDraft}
            onReplyToMessage={(message) => setComposerMode({ kind: "quote", message })}
          />
        )}
      </PageScrollArea>

      <ConversationComposer
        canReply={replyEnabled && windowOpen}
        sending={sendingConversationReply}
        mode={composerMode}
        onModeChange={setComposerMode}
        quotePreview={
          composerMode.kind === "quote"
            ? quotedMessagePreview(
                composerMode.message,
                participant.username,
                participant.displayName,
                brandUsername,
              )
            : null
        }
        onSend={onConversationReply}
      />

      <ConversationSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        replyMode={replyMode}
        replyPrompt={replyPrompt}
        savingReplyMode={savingReplyMode}
        savingBriefing={savingBriefing}
        onReplyModeChange={onReplyModeChange}
        onReplyPromptChange={onReplyPromptChange}
        onSaveBriefing={onSaveBriefing}
      />
    </div>
  );
}
