import type { LlmCompleter } from "../ports/llm-completer.ts";
import type { ReplyContextAssemblerDeps } from "../domain/reply-context/reply-context-assembler.ts";
import { assembleReplyContext } from "../domain/reply-context/reply-context-assembler.ts";
import { buildReplyPrompt } from "../domain/reply-context/build-reply-prompt.ts";
import type { ReplyContext } from "../domain/reply-context/types.ts";
import { defaultReplyPersona } from "../domain/settings/reply-persona-defaults.ts";
import { DEFAULT_RESPONSE_LANGUAGE } from "../domain/reply-language/response-languages.ts";

export type ReplyAgentInput = {
  caption: string | null;
  commentText: string | null;
  authorUsername: string | null;
};

export type ReplyAgentOptions = {
  llm: LlmCompleter;
  assembler?: ReplyContextAssemblerDeps;
  responseLanguage?: string;
};

export async function generateReply(
  options: ReplyAgentOptions,
  input: ReplyAgentInput | { commentId: string } | { prebuiltContext: ReplyContext },
): Promise<string> {
  if ("prebuiltContext" in input) {
    const prompt = buildReplyPrompt(input.prebuiltContext);
    return options.llm.complete(prompt).then((result) => result.text);
  }

  if ("commentId" in input && options.assembler) {
    const context = await assembleReplyContext(input.commentId, options.assembler);
    if (!context) {
      throw new Error("comment not found for reply context");
    }

    const prompt = buildReplyPrompt(context);
    return options.llm.complete(prompt).then((result) => result.text);
  }

  const legacy = input as ReplyAgentInput;
  const context: ReplyContext = {
    persona: {
      ...defaultReplyPersona(),
      responseLanguage: options.responseLanguage ?? DEFAULT_RESPONSE_LANGUAGE,
    },
    post: legacy.caption
      ? {
          channel: "instagram",
          status: "published",
          caption: legacy.caption,
          scheduledAt: null,
          publishedAt: null,
          assets: [],
        }
      : null,
    thread: { entries: [] },
    imageContext: { summaries: [], visionEnabled: false },
    brandUsername: null,
    targetComment: {
      authorUsername: legacy.authorUsername,
      text: legacy.commentText,
      igCommentId: null,
    },
  };

  return options.llm.complete(buildReplyPrompt(context)).then((result) => result.text);
}
