import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { createTenancyRuntime } from "./api/tenancy-runtime.ts";
import { importInstallation } from "./domain/accounts/import-installation.ts";
import { localTenancyConfig } from "./domain/accounts/tenancy-config.ts";
import { DATA_DIR, WORKSPACE_ENV_PATH } from "./paths.ts";

if (existsSync(WORKSPACE_ENV_PATH)) {
  loadEnvFile(WORKSPACE_ENV_PATH);
}

const email = (process.argv[2] ?? process.env.IRIS_ADMIN_EMAIL ?? "").trim();
const sourceDbPath = resolve(process.argv[3] ?? resolve(DATA_DIR, "iris.db"));
const sourceMediaDir = resolve(process.argv[4] ?? resolve(DATA_DIR, "media"));

if (!email) {
  console.error(
    "Uso: node --experimental-strip-types src/import-account.ts <email> [iris.db] [pasta de mídia]",
  );
  process.exit(1);
}

if (!existsSync(sourceDbPath)) {
  console.error(`Arquivo de origem não encontrado: ${sourceDbPath}`);
  process.exit(1);
}

const tenancy = createTenancyRuntime({
  config: localTenancyConfig(),
  contextOptions: {},
});

try {
  const result = await importInstallation({
    tenancy,
    email,
    sourceDbPath,
    sourceMediaDir: existsSync(sourceMediaDir) ? sourceMediaDir : undefined,
  });
  console.log(JSON.stringify(result));
} finally {
  tenancy.close();
}
