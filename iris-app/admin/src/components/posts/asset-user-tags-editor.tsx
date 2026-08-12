import { X } from "lucide-react";
import {
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AssetUserTag } from "@/lib/types";

const USER_TAGS_MAX = 20;

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function roundCoord(value: number): number {
  return Math.round(clamp01(value) * 100) / 100;
}

type AssetUserTagsEditorProps = {
  previewUrl: string;
  width: number | null;
  height: number | null;
  tags: AssetUserTag[];
  onChange: (next: AssetUserTag[]) => void;
  disabled?: boolean;
};

export function AssetUserTagsEditor({
  previewUrl,
  width,
  height,
  tags,
  onChange,
  disabled = false,
}: AssetUserTagsEditorProps) {
  const [draft, setDraft] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(
    tags.length > 0 ? 0 : null,
  );
  const atLimit = tags.length >= USER_TAGS_MAX;
  const naturalW = width && width > 0 ? width : 1;
  const naturalH = height && height > 0 ? height : 1;

  function commitDraft(at?: { x: number; y: number }) {
    const username = normalizeUsername(draft);
    if (!username || disabled || atLimit) {
      return;
    }
    if (
      tags.some((tag) => tag.username.toLowerCase() === username.toLowerCase())
    ) {
      setDraft("");
      return;
    }
    const nextTags = [
      ...tags,
      {
        username,
        x: at?.x ?? 0.5,
        y: at?.y ?? 0.5,
      },
    ];
    onChange(nextTags);
    setActiveIndex(nextTags.length - 1);
    setDraft("");
  }

  function removeAt(index: number) {
    const next = tags.filter((_, i) => i !== index);
    onChange(next);
    setActiveIndex((current) => {
      if (current === null) return null;
      if (next.length === 0) return null;
      if (current === index) return Math.min(index, next.length - 1);
      if (current > index) return current - 1;
      return current;
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
      return;
    }
    if (event.key === "Backspace" && !draft && tags.length > 0) {
      removeAt(tags.length - 1);
    }
  }

  function onPreviewClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    const frame = event.currentTarget.getBoundingClientRect();
    const x = roundCoord((event.clientX - frame.left) / frame.width);
    const y = roundCoord((event.clientY - frame.top) / frame.height);

    const username = normalizeUsername(draft);
    if (username) {
      commitDraft({ x, y });
      return;
    }

    if (activeIndex === null || !tags[activeIndex]) {
      return;
    }

    onChange(
      tags.map((tag, index) =>
        index === activeIndex ? { ...tag, x, y } : tag,
      ),
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="presentation"
        onClick={onPreviewClick}
        className={cn(
          "relative mx-auto w-full max-w-md overflow-hidden rounded-(--iris-radius-sm) border border-border bg-muted/20",
          !disabled && "cursor-crosshair",
        )}
        style={{ aspectRatio: `${naturalW} / ${naturalH}` }}
      >
        <img
          src={previewUrl}
          alt=""
          className="size-full object-contain"
          draggable={false}
        />
        {tags.map((tag, index) => (
          <button
            key={`${tag.username}-${index}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActiveIndex(index);
            }}
            className={cn(
              "absolute z-10 max-w-[45%] -translate-x-1/2 -translate-y-1/2 truncate rounded-full border px-1.5 py-0.5 text-[10px] font-medium shadow-none",
              activeIndex === index
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/95 text-foreground",
            )}
            style={{
              left: `${tag.x * 100}%`,
              top: `${tag.y * 100}%`,
            }}
            title={`@${tag.username} (${tag.x.toFixed(2)}, ${tag.y.toFixed(2)})`}
          >
            @{tag.username}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
          disabled && "opacity-60",
        )}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag.username}-${index}`}
            className={cn(
              "inline-flex h-6 max-w-full items-center gap-1 rounded-md border px-2 text-xs",
              activeIndex === index
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground",
            )}
          >
            <button
              type="button"
              className="truncate"
              disabled={disabled}
              onClick={() => setActiveIndex(index)}
            >
              @{tag.username} · {tag.x.toFixed(2)},{tag.y.toFixed(2)}
            </button>
            {!disabled ? (
              <button
                type="button"
                className="rounded-sm opacity-70 hover:opacity-100"
                aria-label={`Remover @${tag.username}`}
                onClick={() => removeAt(index)}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </span>
        ))}
        {!disabled && !atLimit ? (
          <Input
            id="asset-user-tags"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              tags.length === 0
                ? "username + Enter, depois clique na foto"
                : "outro username + Enter"
            }
            className="h-6 min-w-40 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            autoComplete="off"
          />
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Enter adiciona a pill (centro 0.50,0.50). Selecione a pill e clique na
        imagem para posicionar. Remova pela × da pill.
      </p>
    </div>
  );
}
