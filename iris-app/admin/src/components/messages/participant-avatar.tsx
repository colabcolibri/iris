import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  participantDisplayLabel,
  participantInitials,
} from "@/lib/participant-display";
import { cn } from "@/lib/utils";

type ParticipantAvatarProps = {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function ParticipantAvatar({
  username,
  displayName,
  avatarUrl,
  className,
  fallbackClassName,
}: ParticipantAvatarProps) {
  const label = participantDisplayLabel(username, displayName);
  const initials = participantInitials(username, displayName);

  return (
    <Avatar className={cn("size-9 shrink-0 border border-border/40", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={label} className="object-cover" />
      ) : null}
      <AvatarFallback className={cn("text-xs font-semibold", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
