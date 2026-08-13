import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatRelativeTimeAgo,
  useRelativeTimeTick,
} from "@/lib/format-relative-time";
import type { ConversationSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConversationInboxListProps = {
  conversations: ConversationSummary[];
  selectedId: string;
  onSelect: (conversationId: string) => void;
};

function formatHandle(username: string | null | undefined): string {
  const value = username?.trim() || "usuário";
  return value.startsWith("@") ? value : `@${value}`;
}

function LastMessageTime({ value }: { value: string | null }) {
  useRelativeTimeTick();
  if (!value) {
    return <span className="text-xs text-muted-foreground">sem mensagens</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock3 className="size-3 shrink-0" aria-hidden />
      {formatRelativeTimeAgo(value) || "agora"}
    </span>
  );
}

export function ConversationInboxList({
  conversations,
  selectedId,
  onSelect,
}: ConversationInboxListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {conversations.map((conversation) => {
        const selected = conversation.id === selectedId;
        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "flex w-full flex-col gap-2 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40",
              selected && "bg-muted/60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {formatHandle(conversation.participant_username)}
              </p>
              {conversation.pending_count > 0 ? (
                <Badge className="shrink-0 bg-amber-500 text-white hover:bg-amber-500/90">
                  {conversation.pending_count}
                </Badge>
              ) : null}
            </div>
            <LastMessageTime value={conversation.last_message_at} />
          </button>
        );
      })}
    </div>
  );
}
