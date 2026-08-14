import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SimulatorThreadRow } from "@/components/agent-simulator/types";

export type SimulatorThreadEditorLabels = {
  thread: string;
  addMessage: string;
  authorPlaceholder: string;
  brandCheckbox: string;
  targetTitle: string;
  targetAuthorPlaceholder: string;
};

type SimulatorThreadEditorProps = {
  thread: SimulatorThreadRow[];
  onThreadChange: (rows: SimulatorThreadRow[]) => void;
  targetAuthor: string;
  onTargetAuthorChange: (value: string) => void;
  targetText: string;
  onTargetTextChange: (value: string) => void;
  labels: SimulatorThreadEditorLabels;
};

export function SimulatorThreadEditor({
  thread,
  onThreadChange,
  targetAuthor,
  onTargetAuthorChange,
  targetText,
  onTargetTextChange,
  labels,
}: SimulatorThreadEditorProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>{labels.thread}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onThreadChange([
                ...thread,
                {
                  id: crypto.randomUUID(),
                  author: "fan",
                  text: "",
                  is_brand_reply: false,
                },
              ])
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {labels.addMessage}
          </Button>
        </div>

        <div className="space-y-3">
          {thread.map((row, index) => {
            const isBrand = Boolean(row.is_brand_reply);
            return (
              <div
                key={row.id}
                className={cn(
                  "flex flex-col gap-2",
                  isBrand ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "w-full max-w-[95%] rounded-(--iris-radius-lg) border p-3",
                    isBrand
                      ? "border-primary/25 bg-primary/5"
                      : "border-border/70 bg-muted/20",
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Input
                      value={row.author}
                      onChange={(event) =>
                        onThreadChange(
                          thread.map((item, i) =>
                            i === index ? { ...item, author: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder={labels.authorPlaceholder}
                      className="h-8 text-xs"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isBrand}
                        onChange={(event) =>
                          onThreadChange(
                            thread.map((item, i) =>
                              i === index
                                ? { ...item, is_brand_reply: event.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                      {labels.brandCheckbox}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() =>
                        onThreadChange(thread.filter((item) => item.id !== row.id))
                      }
                      disabled={thread.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={row.text}
                    onChange={(event) =>
                      onThreadChange(
                        thread.map((item, i) =>
                          i === index ? { ...item, text: event.target.value } : item,
                        ),
                      )
                    }
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 rounded-(--iris-radius-lg) border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          {labels.targetTitle}
        </p>
        <Input
          value={targetAuthor}
          onChange={(event) => onTargetAuthorChange(event.target.value)}
          placeholder={labels.targetAuthorPlaceholder}
          className="h-8 text-xs"
        />
        <Textarea
          rows={2}
          value={targetText}
          onChange={(event) => onTargetTextChange(event.target.value)}
        />
      </div>
    </>
  );
}
