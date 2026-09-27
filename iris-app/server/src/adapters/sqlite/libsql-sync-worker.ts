import { parentPort, workerData } from "node:worker_threads";

type WorkerData = {
  url: string;
  authToken: string;
};

type RequestMessage = {
  sql: string;
  args: unknown[];
  sab: SharedArrayBuffer;
};

type Arg = { type: string; value?: string };

function encodeArg(value: unknown): Arg {
  if (value === null || value === undefined) {
    return { type: "null" };
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return { type: "integer", value: String(value) };
  }
  if (typeof value === "number") {
    return { type: "float", value: String(value) };
  }
  if (typeof value === "bigint") {
    return { type: "integer", value: value.toString() };
  }
  return { type: "text", value: String(value) };
}

function decodeValue(value: { type?: string; value?: string } | null): unknown {
  if (!value || value.type === "null" || value.value === undefined) {
    return null;
  }
  if (value.type === "integer" || value.type === "float") {
    return Number(value.value);
  }
  return value.value;
}

function pipelineUrl(libsqlUrl: string): string {
  const host = libsqlUrl.replace(/^libsql:\/\//, "").replace(/^https:\/\//, "");
  return `https://${host}/v2/pipeline`;
}

async function execute(
  data: WorkerData,
  sql: string,
  args: unknown[],
): Promise<{ columns: string[]; rows: unknown[][]; rowsAffected: number }> {
  const response = await fetch(pipelineUrl(data.url), {
    method: "POST",
    headers: {
      authorization: `Bearer ${data.authToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: args.map(encodeArg) } },
        { type: "close" },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`libsql http ${response.status}`);
  }

  const body = (await response.json()) as {
    results?: Array<{
      type?: string;
      error?: { message?: string };
      response?: {
        result?: {
          cols?: Array<{ name: string }>;
          rows?: Array<{ values?: Array<{ type?: string; value?: string } | null> }>;
          affected_row_count?: number;
        };
      };
    }>;
  };

  const first = body.results?.[0];
  if (!first || first.type === "error") {
    throw new Error(first?.error?.message ?? "libsql execute failed");
  }

  const result = first.response?.result;
  return {
    columns: (result?.cols ?? []).map((col) => col.name),
    rows: (result?.rows ?? []).map((row) =>
      (row.values ?? []).map((value) => decodeValue(value)),
    ),
    rowsAffected: result?.affected_row_count ?? 0,
  };
}

const data = workerData as WorkerData;

parentPort?.on("message", (init: { port: import("node:worker_threads").MessagePort }) => {
  init.port.on("message", (message: RequestMessage) => {
    const done = new Int32Array(message.sab);
    void execute(data, message.sql, message.args)
      .then((result) => {
        init.port.postMessage({ ok: true, result });
      })
      .catch((error: unknown) => {
        const text = error instanceof Error ? error.message : "libsql error";
        init.port.postMessage({ ok: false, error: text });
      })
      .finally(() => {
        Atomics.store(done, 0, 1);
        Atomics.notify(done, 0);
      });
  });
});
