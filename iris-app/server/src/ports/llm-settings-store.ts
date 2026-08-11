export type LlmSettings = {
  apiKey: string | null;
  apiUrl: string;
  model: string;
  supportsVision: boolean;
  updatedAt: string;
};

export type UpsertLlmSettingsInput = {
  apiKey?: string | null;
  apiUrl: string;
  model: string;
  supportsVision: boolean;
};

export type LlmSettingsStore = {
  get(): LlmSettings | null;
  upsert(input: UpsertLlmSettingsInput): LlmSettings;
  clear(): void;
};
