export type ProvisionedDatabase = {
  name: string;
  url: string;
  authToken: string | null;
  migrationVersion: string;
};

export type AccountDatabaseProvisioner = {
  create(accountId: string): Promise<ProvisionedDatabase>;
};

type FetchLike = typeof fetch;

export function createTursoProvisioner(input: {
  org: string;
  platformToken: string;
  group: string;
  location: string;
  fetchImpl?: FetchLike;
  applyMigrations: (url: string, authToken: string) => Promise<string> | string;
}): AccountDatabaseProvisioner {
  const fetchImpl = input.fetchImpl ?? fetch;
  const headers = {
    authorization: `Bearer ${input.platformToken}`,
    "content-type": "application/json",
  };

  return {
    async create(accountId: string): Promise<ProvisionedDatabase> {
      const name = `iris-${accountId.replace(/[^a-z0-9-]/gi, "").toLowerCase()}`.slice(0, 32);
      const base = `https://api.turso.tech/v1/organizations/${input.org}`;

      await fetchImpl(`${base}/groups`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: input.group, location: input.location }),
      });

      const created = await fetchImpl(`${base}/databases`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, group: input.group }),
      });
      if (!created.ok && created.status !== 409) {
        throw new Error(`turso create database failed: ${created.status}`);
      }

      const tokenResponse = await fetchImpl(`${base}/databases/${name}/auth/tokens`, {
        method: "POST",
        headers,
        body: JSON.stringify({ authorization: "full-access" }),
      });
      if (!tokenResponse.ok) {
        throw new Error(`turso create token failed: ${tokenResponse.status}`);
      }
      const tokenBody = (await tokenResponse.json()) as { jwt?: string };
      const authToken = tokenBody.jwt ?? "";
      if (!authToken) {
        throw new Error("turso token missing");
      }

      const described = await fetchImpl(`${base}/databases/${name}`, { headers });
      const describedBody = (await described.json()) as {
        database?: { Hostname?: string; hostname?: string };
      };
      const hostname =
        describedBody.database?.hostname ?? describedBody.database?.Hostname ?? "";
      if (!hostname) {
        throw new Error("turso hostname missing");
      }

      const url = `libsql://${hostname}`;
      const migrationVersion = await input.applyMigrations(url, authToken);
      return { name, url, authToken, migrationVersion };
    },
  };
}
