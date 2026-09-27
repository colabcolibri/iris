export type LlmProviderPreset = {
  id: string;
  label: string;
  apiUrl: string;
};

/** OpenAI-compatible chat completions endpoints. */
export const LLM_PROVIDER_PRESETS: readonly LlmProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  },
  {
    id: "groq",
    label: "Groq",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    apiUrl: "https://api.deepseek.com/chat/completions",
  },
  {
    id: "mistral",
    label: "Mistral",
    apiUrl: "https://api.mistral.ai/v1/chat/completions",
  },
  {
    id: "xai",
    label: "xAI",
    apiUrl: "https://api.x.ai/v1/chat/completions",
  },
  {
    id: "google",
    label: "Google AI",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  },
];

export function requireChatCompletionsUrl(value: string): string {
  const trimmed = value.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("api_url must be an absolute http(s) URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("api_url must be an absolute http(s) URL");
  }
  if (!url.hostname) {
    throw new Error("api_url must be an absolute http(s) URL");
  }

  return url.toString();
}
