export type ReplyPersona = {
  systemPrompt: string;
  tone: string;
  brandName: string | null;
  maxChars: number;
  updatedAt: string;
};

export type ReplyPersonaStore = {
  get(): ReplyPersona | null;
  upsert(input: Omit<ReplyPersona, "updatedAt"> & { updatedAt?: string }): ReplyPersona;
};
