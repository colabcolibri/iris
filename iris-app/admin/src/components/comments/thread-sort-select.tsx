import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDomainMessages } from "@/i18n/provider";
import {
  THREAD_SORT_MODES,
  type ThreadSortMode,
} from "@/lib/build-comment-tree";
import { cn } from "@/lib/utils";
import { ArrowDownUp } from "lucide-react";

type ThreadSortSelectProps = {
  value: ThreadSortMode;
  onChange: (value: ThreadSortMode) => void;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
};

const SORT_LABEL_KEY: Record<
  ThreadSortMode,
  "sortActivityDesc" | "sortActivityAsc" | "sortRootDesc" | "sortRootAsc" | "sortPendingFirst"
> = {
  activity_desc: "sortActivityDesc",
  activity_asc: "sortActivityAsc",
  root_desc: "sortRootDesc",
  root_asc: "sortRootAsc",
  pending_first: "sortPendingFirst",
};

export function ThreadSortSelect({
  value,
  onChange,
  className,
  disabled = false,
  fullWidth = false,
}: ThreadSortSelectProps) {
  const detail = useDomainMessages("comments").detail;

  const selectedLabel = detail[SORT_LABEL_KEY[value]];

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ThreadSortMode)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "gap-1.5 border-border/60 bg-muted/40 px-2.5 text-xs shadow-none",
          fullWidth
            ? "h-9 w-full max-w-none"
            : "h-8 w-auto max-w-[11.5rem] shrink-0",
          className,
        )}
      >
        <ArrowDownUp
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <SelectValue placeholder={detail.threadSort}>
          <span className="truncate">{selectedLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align={fullWidth ? "start" : "end"}
        className="min-w-[12.5rem]"
      >
        {THREAD_SORT_MODES.map((mode) => (
          <SelectItem key={mode} value={mode} className="text-sm">
            {detail[SORT_LABEL_KEY[mode]]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
