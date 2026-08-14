import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { useDomainMessages } from "@/i18n/provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ConversationReplyMode } from "@/lib/types";

type ConversationSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyMode: ConversationReplyMode;
  replyPrompt: string;
  savingReplyMode: boolean;
  savingBriefing: boolean;
  onReplyModeChange: (mode: ConversationReplyMode) => void;
  onReplyPromptChange: (value: string) => void;
  onSaveBriefing: () => void;
};

export function ConversationSettingsSheet({
  open,
  onOpenChange,
  replyMode,
  replyPrompt,
  savingReplyMode,
  savingBriefing,
  onReplyModeChange,
  onReplyPromptChange,
  onSaveBriefing,
}: ConversationSettingsSheetProps) {
  const detail = useDomainMessages("messages").detail;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle className="font-display text-lg font-semibold">
            {detail.settings}
          </SheetTitle>
          <SheetDescription>{detail.settingsDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="conversation-reply-mode">{detail.replyMode}</Label>
            <ReplyModeSelect
              id="conversation-reply-mode"
              variant="post"
              value={replyMode}
              disabled={savingReplyMode}
              onChange={(value) => onReplyModeChange(value as ConversationReplyMode)}
            />
            <p className="text-xs text-muted-foreground">
              {detail.replyModeInheritHint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversation-reply-prompt">{detail.briefing}</Label>
            <Textarea
              id="conversation-reply-prompt"
              value={replyPrompt}
              onChange={(event) => onReplyPromptChange(event.target.value)}
              rows={6}
              placeholder={detail.briefingPlaceholder}
              className="min-h-[8rem] resize-y"
            />
            <Button
              type="button"
              size="sm"
              disabled={savingBriefing}
              onClick={onSaveBriefing}
            >
              {savingBriefing ? <Loader2 className="size-4 animate-spin" /> : null}
              {detail.saveBriefing}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
