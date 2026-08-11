import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THREAD_SORT_OPTIONS, type ThreadSortMode } from "@/lib/build-comment-tree";
import { cn } from "@/lib/utils";
import { ArrowDownUp } from "lucide-react";

type ThreadSortSelectProps = {
  value: ThreadSortMode;
  onChange: (value: ThreadSortMode) => void;
  className?: string;
  disabled?: boolean;
};

export function ThreadSortSelect({
  value,
  onChange,
  className,
  disabled = false,
}: ThreadSortSelectProps) {
  const selected = THREAD_SORT_OPTIONS.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ThreadSortMode)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-8 w-auto max-w-[11.5rem] shrink-0 gap-1.5 border-border/60 bg-muted/40 px-2.5 text-xs shadow-none",
          className,
        )}
      >
        <ArrowDownUp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue placeholder="Ordenar">
          <span className="truncate">{selected?.label ?? "Ordenar"}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[12.5rem]">
        {THREAD_SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-sm">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
