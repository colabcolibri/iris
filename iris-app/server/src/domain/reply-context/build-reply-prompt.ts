import type { ReplyContext } from "./types.ts";
import { buildResponseLanguageDirective, buildBrandLine } from "../reply-harness/prompt-language.ts";
import { buildContextSection } from "../reply-harness/prompt-sections.ts";

export function buildReplyPrompt(context: ReplyContext): string {
  const sections: string[] = [
    "Write an Instagram comment reply on behalf of the brand.",
    "",
    buildResponseLanguageDirective(context.persona, { forPublicReply: true }),
    "",
  ];

  const brandLine = buildBrandLine(context.persona);
  if (brandLine) {
    sections.push(brandLine, "");
  }

  if (context.post) {
    sections.push(
      "## Post",
      `Channel: ${context.post.channel}`,
      `Status: ${context.post.status}`,
      `Caption: ${context.post.caption ?? "(no caption)"}`,
      context.post.scheduledAt ? `Scheduled: ${context.post.scheduledAt}` : "",
      context.post.publishedAt ? `Published: ${context.post.publishedAt}` : "",
      `Assets: ${context.post.assets.length}`,
      "",
    );
  }

  if (context.imageContext.summaries.length > 0) {
    sections.push("## Visual", ...context.imageContext.summaries, "");
  }

  sections.push("## Context", buildContextSection(context, "full"), "");

  sections.push(
    `Write a short, useful, on-brand reply. No hashtags. Maximum ${context.persona.maxChars} characters.`,
    "REMINDER: the reply text MUST be in the configured response language above.",
  );

  return sections.filter((line) => line !== "").join("\n").trim();
}
