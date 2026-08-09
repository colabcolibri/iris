import type { LlmCompleter } from "../../ports/llm-completer.ts";

export type EnvLlmCompleterConfig = {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

type ChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
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

      if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? `LLM request failed (${response.status})`);
      }

      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("LLM returned empty response");
      }

      return content.slice(0, 2200);
    },
  };
}
