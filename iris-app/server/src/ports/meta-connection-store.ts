export type MetaConnection = {
  igUserId: string;
  igUsername: string | null;
  pageId: string;
  pageName: string | null;
  connectedAt: string;
  updatedAt: string;
};

export type MetaConnectionStore = {
  get(): MetaConnection | null;
  upsert(connection: Omit<MetaConnection, "connectedAt" | "updatedAt"> & {
    connectedAt?: string;
    updatedAt?: string;
  }): MetaConnection;
  clear(): void;
};
