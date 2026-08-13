import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ParticipantAvatar } from "@/components/messages/participant-avatar";
import {
  formatParticipantHandle,
  participantDisplayLabel,
  resolveParticipantForDisplay,
} from "@/lib/participant-display";
import {
  formatRelativeTimeAgo,
  useRelativeTimeTick,
} from "@/lib/format-relative-time";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import type { ConversationSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConversationInboxListProps = {
  conversations: ConversationSummary[];
  selectedId: string;
  brandUsername?: string | null;
  onSelect: (conversationId: string) => void;
};

function LastMessageTime({ value }: { value: string | null }) {
  const { locale } = useAppLocale();
  const empty = useDomainMessages("messages").empty;
  useRelativeTimeTick();

  if (!value) {
    return (
      <span className="text-xs text-muted-foreground">
        {empty.noMessages}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock3 className="size-3 shrink-0" aria-hidden />
      {formatRelativeTimeAgo(value, locale) || empty.now}
    </span>
  );
}

export function ConversationInboxList({
  conversations,
  selectedId,
  brandUsername,
  onSelect,
}: ConversationInboxListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {conversations.map((conversation) => {
        const selected = conversation.id === selectedId;
        const participant = resolveParticipantForDisplay(
          conversation.participant_username,
          conversation.participant_display_name,
          brandUsername,
        );
        const label = participantDisplayLabel(
          participant.username,
          participant.displayName,
        );
        const handle = formatParticipantHandle(participant.username);

        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40",
              selected && "bg-muted/60",
            )}
          >
            <ParticipantAvatar
              username={participant.username}
              displayName={participant.displayName}
              avatarUrl={conversation.participant_avatar_url}
              className="size-11"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  {participant.username ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {handle}
                    </p>
                  ) : null}
                </div>
                {(conversation.unread_count ?? conversation.pending_count) >
                0 ? (
                  <Badge className="shrink-0 bg-amber-500 px-1.5 text-xs text-white hover:bg-amber-500/90">
                    {(conversation.unread_count ?? conversation.pending_count) > 9
                      ? "9+"
                      : (conversation.unread_count ?? conversation.pending_count)}
                  </Badge>
                ) : null}
              </div>
              <LastMessageTime value={conversation.last_message_at} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
