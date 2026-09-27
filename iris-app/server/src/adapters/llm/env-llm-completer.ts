import {
  LlmCompletionError,
  type LlmCompleteOptions,
  type LlmCompleter,
  type LlmImageInput,
  type LlmUsage,
} from "../../ports/llm-completer.ts";
import type { LlmCallLog } from "../../ports/llm-call-log.ts";
import type { ChatResponse } from "./openai-chat-response.ts";
import { withLlmCallLog } from "./recording-llm-completer.ts";

export type EnvLlmCompleterConfig = {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  callLog: LlmCallLog;
};

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function readUsage(json: ChatResponse): LlmUsage | null {
  if (
    !json.usage ||
    typeof json.usage.prompt_tokens !== "number" ||
    typeof json.usage.completion_tokens !== "number"
  ) {
    return null;
  }

  return {
    promptTokens: json.usage.prompt_tokens,
    completionTokens: json.usage.completion_tokens,
    totalTokens:
      typeof json.usage.total_tokens === "number"
        ? json.usage.total_tokens
        : json.usage.prompt_tokens + json.usage.completion_tokens,
  };
}

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

export function createEnvLlmCompleter(config: EnvLlmCompleterConfig): LlmCompleter {
  return withLlmCallLog(createProviderLlmCompleter(config), config.callLog);
}

function createProviderLlmCompleter(config: EnvLlmCompleterConfig): LlmCompleter {
  const apiKey = config.apiKey?.trim() ?? "";
  const apiUrl = config.apiUrl?.trim() ?? "";
  const model = config.model?.trim() || "gpt-4o-mini";
  const fetchFn = config.fetchImpl ?? fetch;

  return {
    async complete(prompt, options?: LlmCompleteOptions) {
      if (!apiKey) {
        throw new Error("LLM api key is not configured");
      }
      if (!apiUrl) {
        throw new Error("LLM api url is not configured");
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
      const usage = readUsage(json);
      const responseModel = json.model ?? model;

      if (!response.ok || json.error) {
        throw new LlmCompletionError(
          json.error?.message ?? `LLM request failed (${response.status})`,
          { model: responseModel, usage, latencyMs },
        );
      }

      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new LlmCompletionError("LLM returned empty response", {
          model: responseModel,
          usage,
          latencyMs,
        });
      }

      const maxOutputChars = options?.maxOutputChars ?? 2200;

      return {
        text: content.slice(0, maxOutputChars),
        model: responseModel,
        usage,
        latencyMs,
      };
    },
  };
}
