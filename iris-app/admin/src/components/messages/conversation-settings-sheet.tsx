import { AppSheet } from "@/components/templates/app-sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDomainMessages } from "@/i18n/provider";
import type { ConversationReplyMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BotOff, ClipboardCheck, Globe2, Loader2, Zap } from "lucide-react";

const REPLY_MODES = ["inherit", "off", "auto", "draft"] as const;

const REPLY_MODE_ICONS = {
  inherit: Globe2,
  off: BotOff,
  auto: Zap,
  draft: ClipboardCheck,
} as const;

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
    <AppSheet open={open} onOpenChange={onOpenChange} size="md">
      <AppSheet.Header title={detail.settings} description={detail.settingsDescription} />
      <AppSheet.Body>
        <div className="space-y-6">
          <fieldset className="min-w-0 space-y-2" disabled={savingReplyMode}>
            <legend className="text-sm font-medium text-foreground">{detail.replyMode}</legend>
            <div className="grid gap-2" role="radiogroup" aria-label={detail.replyMode}>
              {REPLY_MODES.map((mode) => {
                const option = detail.replyModes[mode];
                const Icon = REPLY_MODE_ICONS[mode];
                const selected = replyMode === mode;
                return (
                  <label
                    key={mode}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-start gap-3 rounded-sm border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/40",
                      savingReplyMode && "cursor-wait opacity-70",
                    )}
                  >
                    <input
                      type="radio"
                      name="conversation-reply-mode"
                      value={mode}
                      checked={selected}
                      disabled={savingReplyMode}
                      onChange={() => onReplyModeChange(mode)}
                      className="mt-1 size-4 shrink-0 accent-primary"
                    />
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm leading-snug wrap-break-word text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="conversation-reply-prompt">{detail.briefing}</Label>
            <Textarea
              id="conversation-reply-prompt"
              value={replyPrompt}
              onChange={(event) => onReplyPromptChange(event.target.value)}
              rows={6}
              placeholder={detail.briefingPlaceholder}
              className="min-h-32 w-full resize-y"
            />
            <p className="text-sm leading-snug text-muted-foreground">{detail.briefingHint}</p>
          </div>
        </div>
      </AppSheet.Body>
      <AppSheet.Footer>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={savingBriefing}
          onClick={onSaveBriefing}
        >
          {savingBriefing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {detail.saveBriefing}
        </Button>
      </AppSheet.Footer>
    </AppSheet>
  );
}
