export type MetaConnection = {
  igUserId: string;
  igUsername: string | null;
  pageId: string;
  pageName: string | null;
  connectedAt: string;
  updatedAt: string;
  hasPageAccessToken: boolean;
};

export type MetaConnectionStore = {
  get(): MetaConnection | null;
  upsert(connection: Omit<MetaConnection, "connectedAt" | "updatedAt" | "hasPageAccessToken"> & {
    connectedAt?: string;
    updatedAt?: string;
    pageAccessToken?: string | null;
  }): MetaConnection;
  upsertPageCredentials(input: {
    pageId: string;
    pageName: string | null;
    pageAccessToken: string;
  }): MetaConnection | null;
  getPageAccessToken(): string | null;
  clear(): void;
};
