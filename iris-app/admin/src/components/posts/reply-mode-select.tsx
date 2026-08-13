import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGlobalReplyModeOptions,
  getPostReplyModeOptions,
} from "@/i18n/domains/labels/helpers";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import type { PostReplyModeSetting, ReplyMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReplyModeSelectBaseProps = {
  disabled?: boolean;
  id?: string;
  className?: string;
};

type GlobalReplyModeSelectProps = ReplyModeSelectBaseProps & {
  variant: "global";
  value: ReplyMode;
  onChange: (value: ReplyMode) => void;
};

type PostReplyModeSelectProps = ReplyModeSelectBaseProps & {
  variant: "post";
  value: PostReplyModeSetting;
  onChange: (value: PostReplyModeSetting) => void;
};

export type ReplyModeSelectProps =
  | GlobalReplyModeSelectProps
  | PostReplyModeSelectProps;

export function ReplyModeSelect(props: ReplyModeSelectProps) {
  const { disabled, id, className, variant } = props;
  const { locale } = useAppLocale();
  const postsMessages = useDomainMessages("posts");
  const options = useMemo(
    () =>
      variant === "global"
        ? getGlobalReplyModeOptions(locale)
        : getPostReplyModeOptions(locale),
    [locale, variant],
  );
  const selected =
    options.find((option) => option.value === props.value) ?? options[0]!;
  const SelectedIcon = selected.icon;

  return (
    <Select
      value={props.value}
      onValueChange={(next) => {
        if (variant === "global") {
          props.onChange(next as ReplyMode);
          return;
        }
        props.onChange(next as PostReplyModeSetting);
      }}
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
          <SelectValue placeholder={postsMessages.replyModeSelect.placeholder}>
            {selected.label}
          </SelectValue>
        </SelectTrigger>
      </div>
      <SelectContent align="start" className="min-w-[var(--anchor-width)]">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className="py-2.5 pl-3 pr-8"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex flex-col gap-0.5 text-left">
                <span className="font-semibold leading-none">
                  {option.label}
                </span>
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
