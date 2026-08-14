import { useEffect, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDomainMessages } from "@/i18n/provider";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ConversationComposerMode =
  | { kind: "free" }
  | { kind: "quote"; message: Message };

type ConversationComposerProps = {
  canReply: boolean;
  sending: boolean;
  mode: ConversationComposerMode;
  onModeChange: (mode: ConversationComposerMode) => void;
  onSend: (text: string, replyToMessageId?: string | null) => void | Promise<void>;
  quotePreview?: string | null;
};

export function ConversationComposer({
  canReply,
  sending,
  mode,
  onModeChange,
  onSend,
  quotePreview,
}: ConversationComposerProps) {
  const thread = useDomainMessages("messages").thread;
  const [text, setText] = useState("");

  useEffect(() => {
    setText("");
  }, [mode.kind, mode.kind === "quote" ? mode.message.id : "free"]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !canReply || sending) {
      return;
    }

    await onSend(trimmed, mode.kind === "quote" ? mode.message.id : null);
    setText("");
    if (mode.kind === "quote") {
      onModeChange({ kind: "free" });
    }
  }

  return (
    <div className="shrink-0 border-t border-border/60 bg-background p-3 sm:p-4">
      {mode.kind === "quote" ? (
        <div className="mb-2 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {thread.replyingTo}
            </p>
            <p className="mt-1 line-clamp-3 text-sm break-words text-foreground">
              {quotePreview || thread.noText}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            aria-label={thread.cancelQuote}
            onClick={() => onModeChange({ kind: "free" })}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          disabled={!canReply || sending}
          placeholder={thread.composerPlaceholder}
          className="min-h-16 flex-1 resize-y text-base"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className={cn("size-10 shrink-0")}
          disabled={!canReply || sending || !text.trim()}
          aria-label={thread.sendMessage}
          onClick={() => void handleSend()}
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
