import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageAttachmentMedia } from "@/components/messages/message-attachment-media";
import {
  useMessageReplyAudit,
} from "@/components/messages/message-reply-audit-section";
import {
  ReplyAuditPanel,
  ReplyAuditTrigger,
} from "@/components/comments/reply-audit-section";
import { ParticipantAvatar } from "@/components/messages/participant-avatar";
import {
  formatParticipantHandle,
  participantDisplayLabel,
  resolveParticipantForDisplay,
} from "@/lib/participant-display";
import type { Message } from "@/lib/types";
import { formatMessageDateTime } from "@/lib/message-time";
import { cn } from "@/lib/utils";

type MessageThreadProps = {
  messages: Message[];
  brandUsername?: string | null;
  participantUsername?: string | null;
  participantDisplayName?: string | null;
  participantAvatarUrl?: string | null;
  canReply?: boolean;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  onApproveDraft: (messageId: string, draftText?: string | null) => void;
  onRemoveDraft: (messageId: string) => void;
  onSaveDraft: (messageId: string, draftText: string) => void | Promise<void>;
  onGenerateDraft: (messageId: string) => void;
  onManualReply: (messageId: string, text: string) => void | Promise<void>;
};

const iconActionClass =
  "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

function messageBodyText(message: Message): string | null {
  const text = message.text?.trim();
  if (text) {
    return text;
  }
  if (message.attachment_url) {
    return null;
  }
  return "(sem texto)";
}

function shouldShowReplyAudit(message: Message): boolean {
  if (message.draft_text) {
    return true;
  }
  return (
    message.status === "skipped" ||
    message.status === "failed" ||
    message.status === "replied"
  );
}

function MessageBubble({
  message,
  outbound,
  authorLabel,
  authorHandle,
  showPendingBadge,
}: {
  message: Message;
  outbound: boolean;
  authorLabel: string;
  authorHandle: string;
  showPendingBadge: boolean;
}) {
  const bodyText = messageBodyText(message);
  const sentAt = formatMessageDateTime(message);

  return (
    <div
      className={cn(
        "min-w-0 flex-1 overflow-hidden rounded-[var(--iris-radius-lg)] px-3 py-2 text-base",
        outbound
          ? "bg-primary/15 text-foreground"
          : "border border-border/60 bg-muted/30 text-foreground",
      )}
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">{authorLabel}</span>
          <span className="text-xs text-muted-foreground">{authorHandle}</span>
          {showPendingBadge ? (
            <Badge variant="secondary" className="text-xs">
              pendente
            </Badge>
          ) : null}
        </div>
        <time
          className="shrink-0 text-xs text-muted-foreground"
          dateTime={message.ig_timestamp ?? message.created_at}
          title={sentAt}
        >
          {sentAt}
        </time>
      </div>

      {bodyText ? (
        <p className="leading-relaxed break-words whitespace-pre-wrap">{bodyText}</p>
      ) : null}

      {message.attachment_url ? (
        <MessageAttachmentMedia
          url={message.attachment_url}
          mediaType={message.attachment_media_type}
        />
      ) : null}

      {message.linked_reply_text ? (
        <p className="mt-2 border-t border-border/40 pt-2 text-sm break-words text-muted-foreground">
          Resposta enviada: {message.linked_reply_text}
        </p>
      ) : null}
    </div>
  );
}

function MessageDraftPanel({
  message,
  canReply,
  approvingId,
  removingDraftId,
  savingDraftId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
}: {
  message: Message;
  canReply: boolean;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  onApproveDraft: MessageThreadProps["onApproveDraft"];
  onRemoveDraft: MessageThreadProps["onRemoveDraft"];
  onSaveDraft: MessageThreadProps["onSaveDraft"];
}) {
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(message.draft_text ?? "");

  useEffect(() => {
    if (!editing) {
      setDraftValue(message.draft_text ?? "");
    }
  }, [message.draft_text, editing]);

  if (!message.draft_text && !editing) {
    return null;
  }

  const busy =
    approvingId === message.id ||
    removingDraftId === message.id ||
    savingDraftId === message.id;

  return (
    <div className="mt-2 w-full min-w-0 max-w-[min(100%,36rem)] overflow-hidden rounded-md border border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between gap-2 border-b border-primary/10 px-3 py-2">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          Sugestão da Iris
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setDraftValue(message.draft_text ?? "");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy || !draftValue.trim()}
                onClick={() => {
                  void Promise.resolve(onSaveDraft(message.id, draftValue.trim())).then(
                    () => setEditing(false),
                  );
                }}
              >
                {savingDraftId === message.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={busy}
                onClick={() => onRemoveDraft(message.id)}
              >
                {removingDraftId === message.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    Deletar
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setEditing(true)}
              >
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy || !canReply}
                onClick={() => onApproveDraft(message.id, message.draft_text)}
              >
                {approvingId === message.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Enviar"
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Textarea
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          rows={3}
          className="min-h-20 w-full min-w-0 resize-y rounded-none border-0 bg-background/80 px-3 py-2 text-base shadow-none focus-visible:ring-0"
        />
      ) : (
        <p className="max-w-full px-3 py-2 text-base leading-relaxed break-words whitespace-pre-wrap">
          {message.draft_text}
        </p>
      )}
    </div>
  );
}

function MessageSideActions({
  message,
  canReply,
  generatingId,
  manualOpen,
  showAudit,
  auditActive,
  onAuditToggle,
  onOpenManual,
  onGenerateDraft,
}: {
  message: Message;
  canReply: boolean;
  generatingId: string | null;
  manualOpen: boolean;
  showAudit: boolean;
  auditActive: boolean;
  onAuditToggle: () => void;
  onOpenManual: () => void;
  onGenerateDraft: MessageThreadProps["onGenerateDraft"];
}) {
  const showReplyActions =
    message.status === "pending" && !message.draft_text && !manualOpen;

  if (!showReplyActions && !showAudit) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-row items-center gap-0.5 self-start pt-1",
        "opacity-100 sm:opacity-0 sm:transition-opacity",
        "group-hover/message:opacity-100 group-focus-within/message:opacity-100",
      )}
    >
      {showReplyActions ? (
        <>
          <button
            type="button"
            className={cn(iconActionClass, "text-primary/80 hover:bg-primary/10 hover:text-primary")}
            aria-label="Gerar rascunho com IA"
            title="Gerar rascunho"
            disabled={!canReply || generatingId === message.id}
            onClick={() => onGenerateDraft(message.id)}
          >
            {generatingId === message.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            className={iconActionClass}
            aria-label="Responder manualmente"
            title="Responder"
            disabled={!canReply}
            onClick={onOpenManual}
          >
            <Send className="size-3.5" />
          </button>
        </>
      ) : null}
      {showAudit ? (
        <ReplyAuditTrigger active={auditActive} onClick={onAuditToggle} />
      ) : null}
    </div>
  );
}

function InboundMessageContent({
  message,
  canReply,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  manualOpen,
  onOpenManual,
  onCloseManual,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  onManualReply,
  children,
}: {
  message: Message;
  canReply: boolean;
  approvingId: string | null;
  removingDraftId: string | null;
  savingDraftId: string | null;
  generatingId: string | null;
  manualOpen: boolean;
  onOpenManual: () => void;
  onCloseManual: () => void;
  onApproveDraft: MessageThreadProps["onApproveDraft"];
  onRemoveDraft: MessageThreadProps["onRemoveDraft"];
  onSaveDraft: MessageThreadProps["onSaveDraft"];
  onGenerateDraft: MessageThreadProps["onGenerateDraft"];
  onManualReply: MessageThreadProps["onManualReply"];
  children: ReactNode;
}) {
  const auditState = useMessageReplyAudit(message.id);
  const showAudit = shouldShowReplyAudit(message);

  return (
    <>
      <div className="flex w-full min-w-0 items-start gap-1">
        {children}
        <MessageSideActions
          message={message}
          canReply={canReply}
          generatingId={generatingId}
          manualOpen={manualOpen}
          showAudit={showAudit}
          auditActive={auditState.open}
          onAuditToggle={() => void auditState.toggle()}
          onOpenManual={onOpenManual}
          onGenerateDraft={onGenerateDraft}
        />
      </div>

      <MessageManualReplyPanel
        message={message}
        canReply={canReply}
        manualOpen={manualOpen}
        onCloseManual={onCloseManual}
        onManualReply={onManualReply}
      />
      <MessageDraftPanel
        message={message}
        canReply={canReply}
        approvingId={approvingId}
        removingDraftId={removingDraftId}
        savingDraftId={savingDraftId}
        onApproveDraft={onApproveDraft}
        onRemoveDraft={onRemoveDraft}
        onSaveDraft={onSaveDraft}
      />
      {showAudit && auditState.open ? (
        <ReplyAuditPanel {...auditState} className="mt-1.5 w-full min-w-0" />
      ) : null}
    </>
  );
}

function MessageManualReplyPanel({
  message,
  canReply,
  manualOpen,
  onCloseManual,
  onManualReply,
}: {
  message: Message;
  canReply: boolean;
  manualOpen: boolean;
  onCloseManual: () => void;
  onManualReply: MessageThreadProps["onManualReply"];
}) {
  const [manualText, setManualText] = useState("");

  useEffect(() => {
    if (!manualOpen) {
      setManualText("");
    }
  }, [manualOpen]);

  if (!manualOpen || message.status !== "pending" || message.draft_text) {
    return null;
  }

  return (
    <div className="mt-2 w-full min-w-0 max-w-[min(100%,36rem)] overflow-hidden rounded-md border border-border/50 bg-muted/15">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Resposta manual
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={onCloseManual}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!manualText.trim() || !canReply}
            onClick={() => {
              void Promise.resolve(onManualReply(message.id, manualText.trim())).then(
                onCloseManual,
              );
            }}
          >
            Enviar
          </Button>
        </div>
      </div>
      <Textarea
        value={manualText}
        onChange={(event) => setManualText(event.target.value)}
        rows={2}
        autoFocus
        placeholder="Sua resposta…"
        className="min-h-16 w-full min-w-0 resize-y rounded-none border-0 bg-transparent px-3 py-2 text-base shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

export function MessageThread({
  messages,
  brandUsername,
  participantUsername,
  participantDisplayName,
  participantAvatarUrl,
  canReply = true,
  approvingId,
  removingDraftId,
  savingDraftId,
  generatingId,
  onApproveDraft,
  onRemoveDraft,
  onSaveDraft,
  onGenerateDraft,
  onManualReply,
}: MessageThreadProps) {
  const [manualReplyId, setManualReplyId] = useState<string | null>(null);
  const participant = resolveParticipantForDisplay(
    participantUsername,
    participantDisplayName,
    brandUsername,
  );

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      {messages.map((message) => {
        const outbound = message.direction === "outbound";
        const authorLabel = outbound
          ? participantDisplayLabel(brandUsername, null)
          : participantDisplayLabel(participant.username, participant.displayName);
        const authorHandle = outbound
          ? formatParticipantHandle(brandUsername, "marca")
          : formatParticipantHandle(participant.username);
        const showPendingBadge =
          !outbound && message.status === "pending" && !message.draft_text;
        const manualOpen = manualReplyId === message.id;

        return (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={cn(
              "group/message flex min-w-0 gap-2.5",
              outbound && "flex-row-reverse",
            )}
          >
            <ParticipantAvatar
              username={outbound ? brandUsername : participant.username}
              displayName={outbound ? null : participant.displayName}
              avatarUrl={outbound ? null : participantAvatarUrl}
              className={cn("size-9 shrink-0", outbound && "border-primary/35 bg-primary/10")}
              fallbackClassName={outbound ? "text-primary" : undefined}
            />

            <div
              className={cn(
                "flex min-w-0 max-w-[min(100%,36rem)] flex-1 flex-col",
                outbound ? "items-end" : "items-start",
              )}
            >
              {!outbound ? (
                <InboundMessageContent
                  message={message}
                  canReply={canReply}
                  approvingId={approvingId}
                  removingDraftId={removingDraftId}
                  savingDraftId={savingDraftId}
                  generatingId={generatingId}
                  manualOpen={manualOpen}
                  onOpenManual={() => setManualReplyId(message.id)}
                  onCloseManual={() => setManualReplyId(null)}
                  onApproveDraft={onApproveDraft}
                  onRemoveDraft={onRemoveDraft}
                  onSaveDraft={onSaveDraft}
                  onGenerateDraft={onGenerateDraft}
                  onManualReply={onManualReply}
                >
                  <MessageBubble
                    message={message}
                    outbound={false}
                    authorLabel={authorLabel}
                    authorHandle={authorHandle}
                    showPendingBadge={showPendingBadge}
                  />
                </InboundMessageContent>
              ) : (
                <MessageBubble
                  message={message}
                  outbound
                  authorLabel={authorLabel}
                  authorHandle={authorHandle}
                  showPendingBadge={false}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
