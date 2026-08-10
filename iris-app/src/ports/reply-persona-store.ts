export type ReplyPersona = {
  brandName: string | null;
  responseLanguage: string;
  maxChars: number;
  updatedAt: string;
};

export type ReplyPersonaStore = {
  get(): ReplyPersona | null;
  upsert(input: Omit<ReplyPersona, "updatedAt"> & { updatedAt?: string }): ReplyPersona;
};
