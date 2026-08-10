import type { CommentThreadContext } from "../reply-context/thread-context.ts";

export type BuildThreadBlockOptions = {
  maxEntries?: number;
  truncateCommentChars?: number;
  brandName?: string | null;
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

function authorLabel(
  entry: CommentThreadContext["entries"][number],
  brandName: string | null | undefined,
): string {
  if (entry.isBrandReply) {
    return brandName ? `brand (${brandName})` : "brand";
  }
  if (entry.author) {
    return `@${entry.author}`;
  }
  return "public";
}

export function buildThreadBlock(
  thread: CommentThreadContext,
  options: BuildThreadBlockOptions = {},
): string {
  const maxEntries = options.maxEntries;
  const truncateCommentChars = options.truncateCommentChars ?? 400;
  const sorted = [...thread.entries].sort((a, b) => a.at.localeCompare(b.at));
  const slice = maxEntries ? sorted.slice(-maxEntries) : sorted;

  if (slice.length === 0) {
    return "(no prior comments in thread)";
  }

  return slice
    .map((entry) => {
      const who = authorLabel(entry, options.brandName);
      const text = truncateText(entry.text ?? "", truncateCommentChars);
      return `[${formatTimestamp(entry.at)}] ${who}: ${text}`;
    })
    .join("\n");
}
