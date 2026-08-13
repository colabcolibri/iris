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
import { cn } from "@/lib/utils";

type PipelineDateFilterMenuProps = {
  filter: PipelineDateFilter;
  label: string;
  onChange: (filter: PipelineDateFilter) => void;
  className?: string;
};

const PRESETS: { id: PipelineDatePresetId; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "default", label: "Hoje → +15 dias" },
  { id: "past-30", label: "Últimos 30 dias" },
  { id: "past-60", label: "Últimos 60 dias" },
  { id: "future-30", label: "Hoje → +30 dias" },
  { id: "future-60", label: "Hoje → +60 dias" },
  { id: "current-month", label: "Mês atual" },
  { id: "next-month", label: "Próximo mês" },
];

function dayLabel(days: number) {
  if (days === 0) return "Nenhum";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

export function PipelineDateFilterMenu({
  filter,
  label,
  onChange,
  className,
}: PipelineDateFilterMenuProps) {
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
            aria-label="Filtrar período editorial"
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
            Período
          </DropdownMenuLabel>
          {PRESETS.map((preset) => (
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
            Personalizar
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Passado
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
                Futuro
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
            Rascunhos sem data planejada permanecem sempre visíveis.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
