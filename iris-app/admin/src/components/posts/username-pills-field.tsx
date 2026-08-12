import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

type UsernamePillsFieldProps = {
  id?: string;
  values: string[];
  onChange: (next: string[]) => void;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function UsernamePillsField({
  id,
  values,
  onChange,
  max,
  disabled = false,
  placeholder = "username + Enter",
  className,
}: UsernamePillsFieldProps) {
  const [draft, setDraft] = useState("");
  const atLimit = max !== undefined && values.length >= max;

  function commitDraft() {
    const username = normalizeUsername(draft);
    if (!username || disabled || atLimit) {
      return;
    }
    if (values.some((value) => value.toLowerCase() === username.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, username]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
      return;
    }
    if (event.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
        disabled && "opacity-60",
        className,
      )}
    >
      {values.map((username) => (
        <Badge
          key={username}
          variant="secondary"
          className="h-6 gap-1 rounded-md px-2 font-normal"
        >
          @{username}
          {!disabled ? (
            <button
              type="button"
              className="rounded-sm opacity-70 hover:opacity-100"
              aria-label={`Remover @${username}`}
              onClick={() =>
                onChange(values.filter((value) => value !== username))
              }
            >
              <X className="size-3" />
            </button>
          ) : null}
        </Badge>
      ))}
      {!disabled && !atLimit ? (
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : ""}
          className="h-6 min-w-28 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          autoComplete="off"
        />
      ) : null}
    </div>
  );
}
