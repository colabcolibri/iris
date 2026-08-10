export type MetaTokenStore = {
  getActiveToken(): string | null;
  upsertToken(plain: string, expiresAt?: string | null): void;
  clear(): void;
};
