import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PIPELINE_DAY_OPTIONS,
  pipelineFilterToPresetId,
  pipelinePresetIdToFilter,
  type PipelineDateFilter,
  type PipelineDatePresetId,
} from "@iris/domain/posts/pipeline-date-filter";
import { interpolate } from "@/i18n/compose";
import { useDomainMessages } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type PipelineDateFilterMenuProps = {
  filter: PipelineDateFilter;
  label: string;
  onChange: (filter: PipelineDateFilter) => void;
  className?: string;
};

export function PipelineDateFilterMenu({
  filter,
  label,
  onChange,
  className,
}: PipelineDateFilterMenuProps) {
  const pipeline = useDomainMessages("posts").kanban.pipeline;
  const presets = useMemo(
  (): { id: PipelineDatePresetId; label: string }[] => [
    { id: "all", label: pipeline.presetAll },
    { id: "default", label: pipeline.presets.default },
    { id: "past-30", label: pipeline.presets.past30 },
    { id: "past-60", label: pipeline.presets.past60 },
    { id: "future-30", label: pipeline.presets.future30 },
    { id: "future-60", label: pipeline.presets.future60 },
    { id: "current-month", label: pipeline.presets.currentMonth },
    { id: "next-month", label: pipeline.presets.nextMonth },
  ],
    [pipeline],
  );

  function dayLabel(days: number) {
    if (days === 0) return pipeline.none;
    if (days === 1) return pipeline.dayOne;
    return interpolate(pipeline.daysCount, { count: days });
  }

  const [open, setOpen] = useState(false);
  const activePreset = useMemo(() => pipelineFilterToPresetId(filter), [filter]);

  const customPast =
    filter.kind === "window" ? filter.pastDays : 0;
  const customFuture =
    filter.kind === "window" ? filter.futureDays : 15;

  function applyPreset(preset: PipelineDatePresetId) {
    onChange(
      pipelinePresetIdToFilter(preset, {
        pastDays: customPast,
        futureDays: customFuture,
      }),
    );
    setOpen(false);
  }

  function applyCustom(pastDays: number, futureDays: number) {
    onChange(
      pipelinePresetIdToFilter("custom", { pastDays, futureDays }),
    );
  }

  const radioValue = activePreset === "custom" ? "" : activePreset;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-11 max-w-full gap-2 border-border bg-card px-3 font-normal sm:px-4",
              className,
            )}
            aria-label={pipeline.filterAria}
          />
        }
      >
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,20rem)] p-2">
        <DropdownMenuRadioGroup
          value={radioValue}
          onValueChange={(value) => {
            if (!value) return;
            applyPreset(value as PipelineDatePresetId);
          }}
        >
          <DropdownMenuLabel className="px-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {pipeline.period}
          </DropdownMenuLabel>
          {presets.map((preset) => (
            <DropdownMenuRadioItem
              key={preset.id}
              value={preset.id}
              className="py-2"
            >
              {preset.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="my-2" />

        <div className="space-y-3 px-1.5 pb-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {pipeline.customTitle}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {pipeline.past}
              </span>
              <Select
                value={String(customPast)}
                onValueChange={(value) => {
                  applyCustom(Number(value), customFuture);
                }}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue>{dayLabel(customPast)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_DAY_OPTIONS.map((days) => (
                    <SelectItem key={`past-${days}`} value={String(days)}>
                      {dayLabel(days)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {pipeline.future}
              </span>
              <Select
                value={String(customFuture)}
                onValueChange={(value) => {
                  applyCustom(customPast, Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue>{dayLabel(customFuture)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_DAY_OPTIONS.map((days) => (
                    <SelectItem key={`future-${days}`} value={String(days)}>
                      {dayLabel(days)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {pipeline.customHint}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
