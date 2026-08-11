import type {
  LlmCompleteOptions,
  LlmCompleter,
  LlmImageInput,
} from "../../ports/llm-completer.ts";
import type { ChatResponse } from "./openai-chat-response.ts";

export type EnvLlmCompleterConfig = {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function buildUserContent(
  prompt: string,
  images: LlmImageInput[] | undefined,
): string | ChatContentPart[] {
  if (!images?.length) {
    return prompt;
  }

  return [
    { type: "text", text: prompt },
    ...images.map((image) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${image.mime};base64,${image.base64}`,
      },
    })),
  ];
}

export function createEnvLlmCompleter(
  config: EnvLlmCompleterConfig = {},
): LlmCompleter {
  const apiKey = config.apiKey ?? process.env.LLM_API_KEY ?? "";
  const apiUrl =
    config.apiUrl ?? process.env.LLM_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = config.model ?? process.env.LLM_MODEL ?? "gpt-4o-mini";
  const fetchFn = config.fetchImpl ?? fetch;

  return {
    async complete(prompt, options?: LlmCompleteOptions) {
      if (!apiKey) {
        throw new Error("LLM_API_KEY is not configured");
      }

      const startedAt = Date.now();
      const response = await fetchFn(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: buildUserContent(prompt, options?.images),
            },
          ],
          temperature: 0.7,
        }),
      });

      const json = (await response.json()) as ChatResponse;
      const latencyMs = Date.now() - startedAt;

      if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? `LLM request failed (${response.status})`);
      }

      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("LLM returned empty response");
      }

      const usage =
        json.usage &&
        typeof json.usage.prompt_tokens === "number" &&
        typeof json.usage.completion_tokens === "number"
          ? {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
              totalTokens:
                typeof json.usage.total_tokens === "number"
                  ? json.usage.total_tokens
                  : json.usage.prompt_tokens + json.usage.completion_tokens,
            }
          : null;

      const maxOutputChars = options?.maxOutputChars ?? 2200;

      return {
        text: content.slice(0, maxOutputChars),
        model: json.model ?? model,
        usage,
        latencyMs,
      };
    },
  };
}
