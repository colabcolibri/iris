import {
  sortThreadEntriesChronologically,
  type CommentThreadContext,
} from "../reply-context/thread-context.ts";

export type BuildThreadBlockOptions = {
  maxEntries?: number;
  truncateCommentChars?: number;
  brandName?: string | null;
  brandUsername?: string | null;
  targetIgCommentId?: string | null;
};

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars - 1)}…`;
}

function formatTimestamp(at: string): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) {
    return at;
  }
  return date.toISOString();
}

function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function authorLabel(
  entry: CommentThreadContext["entries"][number],
  options: BuildThreadBlockOptions,
): string {
  if (entry.isBrandReply) {
    return options.brandName ? `brand (${options.brandName})` : "brand";
  }

  const author = entry.author?.trim();
  if (author && options.brandUsername) {
    if (normalizeHandle(author) === normalizeHandle(options.brandUsername)) {
      return `brand (@${normalizeHandle(author)})`;
    }
  }

  if (author) {
    return `@${author.replace(/^@+/, "")}`;
  }

  return "public";
}

export function buildThreadBlock(
  thread: CommentThreadContext,
  options: BuildThreadBlockOptions = {},
): string {
  const maxEntries = options.maxEntries;
  const truncateCommentChars = options.truncateCommentChars ?? 400;
  const ordered = sortThreadEntriesChronologically(thread.entries);
  const slice = maxEntries ? ordered.slice(-maxEntries) : ordered;

  if (slice.length === 0) {
    return "(no prior comments in thread)";
  }

  return slice
    .map((entry) => {
      const who = authorLabel(entry, options);
      const text = truncateText(entry.text ?? "", truncateCommentChars);
      const target =
        options.targetIgCommentId &&
        entry.igCommentId &&
        entry.igCommentId === options.targetIgCommentId
          ? ">>> TARGET "
          : "";
      return `${target}[${formatTimestamp(entry.at)}] ${who}: ${text}`;
    })
    .join("\n");
}
