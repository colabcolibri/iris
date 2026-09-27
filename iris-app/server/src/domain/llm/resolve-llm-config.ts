import type { LlmCallLog } from "../../ports/llm-call-log.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { LlmSettingsStore } from "../../ports/llm-settings-store.ts";
import {
  createEnvLlmCompleter,
  type EnvLlmCompleterConfig,
} from "../../adapters/llm/env-llm-completer.ts";
import {
  DEFAULT_API_URL,
  DEFAULT_MODEL,
} from "../../adapters/sqlite/llm-settings-repository.ts";

export type ResolvedLlmConfig = {
  apiKey: string;
  apiUrl: string;
  model: string;
  supportsVision: boolean;
  source: "database" | "environment";
};

export type LlmConfigResolver = {
  resolve(): ResolvedLlmConfig | null;
  createCompleter(): LlmCompleter | null;
  configuredSources(): { database: boolean; environment: boolean };
};

export function createLlmConfigResolver(
  store: LlmSettingsStore,
  env: EnvLlmCompleterConfig = {},
  callLog?: LlmCallLog,
): LlmConfigResolver {
  const envApiKey = env.apiKey ?? process.env.LLM_API_KEY ?? "";
  const envApiUrl = env.apiUrl ?? process.env.LLM_API_URL ?? DEFAULT_API_URL;
  const envModel = env.model ?? process.env.LLM_MODEL ?? DEFAULT_MODEL;
  const envSupportsVision =
    process.env.LLM_SUPPORTS_VISION === "1"
      ? true
      : process.env.LLM_SUPPORTS_VISION === "0"
        ? false
        : /gpt-4o|claude-3|gemini/i.test(envModel);

  return {
    resolve() {
      const stored = store.get();
      if (stored?.apiKey) {
        return {
          apiKey: stored.apiKey,
          apiUrl: stored.apiUrl || DEFAULT_API_URL,
          model: stored.model || DEFAULT_MODEL,
          supportsVision: stored.supportsVision,
          source: "database",
        };
      }

      if (envApiKey) {
        return {
          apiKey: envApiKey,
          apiUrl: envApiUrl,
          model: envModel,
          supportsVision: envSupportsVision,
          source: "environment",
        };
      }

      return null;
    },

    createCompleter() {
      const config = this.resolve();
      if (!config) {
        return null;
      }
      if (!callLog) {
        throw new Error("LLM call log is required");
      }

      return createEnvLlmCompleter({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        model: config.model,
        fetchImpl: env.fetchImpl,
        callLog,
      });
    },

    configuredSources() {
      const stored = store.get();
      return {
        database: Boolean(stored?.apiKey),
        environment: Boolean(envApiKey),
      };
    },
  };
}

export function llmKeyHint(apiKey: string | null | undefined): string | null {
  if (!apiKey || apiKey.length < 4) {
    return null;
  }

  return apiKey.slice(-4);
}
