import { useEffect, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessageReplyAuditSection } from "@/components/messages/message-reply-audit-section";

type MessageThreadProps = {
  messages: Message[];
  brandUsername?: string | null;
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

function formatHandle(username: string | null | undefined, fallback: string): string {
  const value = username?.trim() || fallback;
  return value.startsWith("@") ? value : `@${value}`;
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

  if (editing) {
    return (
      <div className="mt-3 space-y-2 rounded-[var(--iris-radius-lg)] border border-primary/20 bg-primary/5 p-3">
        <Textarea
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          rows={4}
          className="min-h-[5rem] resize-y"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy || !draftValue.trim()}
            onClick={() => {
              void Promise.resolve(
                onSaveDraft(message.id, draftValue.trim()),
              ).then(() => setEditing(false));
            }}
          >
            Salvar rascunho
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setEditing(false)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-[var(--iris-radius-lg)] border border-primary/20 bg-primary/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Rascunho da Iris
      </p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{message.draft_text}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || !canReply}
          title={
            canReply
              ? undefined
              : "Janela de 24h expirada — a Meta não aceita envio neste momento"
          }
          onClick={() => onApproveDraft(message.id, message.draft_text)}
        >
          {approvingId === message.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Aprovar e enviar"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          Editar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => onRemoveDraft(message.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function InboundActions({
  message,
  canReply,
  generatingId,
  onGenerateDraft,
  onManualReply,
}: {
  message: Message;
  canReply: boolean;
  generatingId: string | null;
  onGenerateDraft: MessageThreadProps["onGenerateDraft"];
  onManualReply: MessageThreadProps["onManualReply"];
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState("");

  if (message.status !== "pending" || message.draft_text) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!canReply || generatingId === message.id}
          title={
            canReply
              ? undefined
              : "Janela de 24h expirada — a Meta não aceita envio neste momento"
          }
          onClick={() => onGenerateDraft(message.id)}
        >
          {generatingId === message.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="size-3.5" />
              Gerar rascunho
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canReply}
          title={
            canReply
              ? undefined
              : "Janela de 24h expirada — a Meta não aceita envio neste momento"
          }
          onClick={() => setManualOpen((value) => !value)}
        >
          <Send className="size-3.5" />
          Responder manual
        </Button>
      </div>
      {manualOpen ? (
        <div className="space-y-2">
          <Textarea
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            rows={3}
            placeholder="Digite a resposta…"
          />
          <Button
            type="button"
            size="sm"
            disabled={!manualText.trim() || !canReply}
            onClick={() => void onManualReply(message.id, manualText.trim())}
          >
            Enviar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function MessageThread({
  messages,
  brandUsername,
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
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const outbound = message.direction === "outbound";
        const author = outbound
          ? formatHandle(brandUsername, "marca")
          : formatHandle(null, "usuário");

        return (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={cn("flex flex-col", outbound ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[min(100%,36rem)] rounded-[var(--iris-radius-lg)] px-3 py-2 text-sm",
                outbound
                  ? "bg-primary/15 text-foreground"
                  : "border border-border/60 bg-muted/30 text-foreground",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {author}
                </span>
                {!outbound && message.status !== "replied" ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {message.status}
                  </Badge>
                ) : null}
                {!outbound && shouldShowReplyAudit(message) ? (
                  <MessageReplyAuditSection messageId={message.id} />
                ) : null}
              </div>
              <p className="whitespace-pre-wrap break-words">
                {message.text?.trim() || "(sem texto)"}
              </p>
              {message.linked_reply_text ? (
                <p className="mt-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                  Resposta enviada: {message.linked_reply_text}
                </p>
              ) : null}
            </div>

            {!outbound ? (
              <>
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
                <InboundActions
                  message={message}
                  canReply={canReply}
                  generatingId={generatingId}
                  onGenerateDraft={onGenerateDraft}
                  onManualReply={onManualReply}
                />
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
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
