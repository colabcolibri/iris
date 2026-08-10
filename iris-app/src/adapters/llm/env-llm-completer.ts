import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { ChatResponse } from "./openai-chat-response.ts";

export type EnvLlmCompleterConfig = {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

export function createEnvLlmCompleter(
  config: EnvLlmCompleterConfig = {},
): LlmCompleter {
  const apiKey = config.apiKey ?? process.env.LLM_API_KEY ?? "";
  const apiUrl =
    config.apiUrl ?? process.env.LLM_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = config.model ?? process.env.LLM_MODEL ?? "gpt-4o-mini";
  const fetchFn = config.fetchImpl ?? fetch;

  return {
    async complete(prompt) {
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
          messages: [{ role: "user", content: prompt }],
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

      return {
        text: content.slice(0, 2200),
        model: json.model ?? model,
        usage,
        latencyMs,
      };
    },
  };
}
