import type { LlmCallLog } from "../../ports/llm-call-log.ts";
import type { LlmCompleter } from "../../ports/llm-completer.ts";
import type { LlmSettingsStore } from "../../ports/llm-settings-store.ts";
import {
  createEnvLlmCompleter,
  type EnvLlmCompleterConfig,
} from "../../adapters/llm/env-llm-completer.ts";
import { DEFAULT_MODEL } from "../../adapters/sqlite/llm-settings-repository.ts";
import { requireChatCompletionsUrl } from "./llm-provider-presets.ts";

export type ResolvedLlmConfig = {
  apiKey: string;
  apiUrl: string;
  model: string;
  supportsVision: boolean;
  source: "database";
};

export type LlmConfigResolver = {
  resolve(): ResolvedLlmConfig | null;
  createCompleter(): LlmCompleter | null;
  configuredSources(): { database: boolean; environment: boolean };
};

function storedConfig(store: LlmSettingsStore): ResolvedLlmConfig | null {
  const stored = store.get();
  if (!stored?.apiKey || !stored.apiUrl.trim()) {
    return null;
  }

  try {
    return {
      apiKey: stored.apiKey,
      apiUrl: requireChatCompletionsUrl(stored.apiUrl),
      model: stored.model || DEFAULT_MODEL,
      supportsVision: stored.supportsVision,
      source: "database",
    };
  } catch {
    return null;
  }
}

export function createLlmConfigResolver(
  store: LlmSettingsStore,
  env: EnvLlmCompleterConfig = {},
  callLog?: LlmCallLog,
): LlmConfigResolver {
  return {
    resolve() {
      return storedConfig(store);
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
      return {
        database: storedConfig(store) !== null,
        environment: false,
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
