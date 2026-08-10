export type McpConnectionSettings = {
  codeHash: string;
  codeHint: string;
  updatedAt: string;
};

export type McpConnectionStore = {
  get(): McpConnectionSettings | null;
  upsert(input: { codeHash: string; codeHint: string }): McpConnectionSettings;
  clear(): void;
};
