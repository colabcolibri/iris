export type LlmCompleter = {
  complete(prompt: string): Promise<string>;
};
