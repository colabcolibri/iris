import { formatCommentTextForDisplay } from "@iris/domain/reply-harness/reply-signature-format";

export function displayCommentText(
  text: string | null | undefined,
  emptyLabel?: string,
): string {
  if (!text?.trim()) {
    return emptyLabel ?? "(sem texto)";
  }
  return formatCommentTextForDisplay(text);
}

export const commentTextClassName =
  "whitespace-pre-wrap wrap-break-word leading-relaxed";
