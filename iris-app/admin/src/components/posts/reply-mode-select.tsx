import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { replyModeOption, REPLY_MODE_OPTIONS } from "@/lib/reply-mode-options";
import type { ReplyMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReplyModeSelectProps = {
  value: ReplyMode;
  onChange: (value: ReplyMode) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function ReplyModeSelect({
  value,
  onChange,
  disabled,
  id,
  className,
}: ReplyModeSelectProps) {
  const selected = replyModeOption(value);
  const SelectedIcon = selected.icon;

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ReplyMode)}
      disabled={disabled}
    >
      <div className={cn("relative w-full", className)}>
        <SelectedIcon
          className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <SelectTrigger
          id={id}
          className="h-10 w-full bg-background pl-10 pr-10 text-left"
        >
          <SelectValue placeholder="Escolha o modo de resposta">{selected.label}</SelectValue>
        </SelectTrigger>
      </div>
      <SelectContent align="start" className="min-w-[var(--anchor-width)]">
        {REPLY_MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value} className="py-2.5 pl-3 pr-8">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex flex-col gap-0.5 text-left">
                <span className="font-medium leading-none">{option.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
