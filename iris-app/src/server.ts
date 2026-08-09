import { createServer } from "./api/http-server.ts";

const port = Number(process.env.PORT ?? 8792);
const host = process.env.HOST ?? "0.0.0.0";

const server = createServer();

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Iris listening on http://${displayHost}:${port}`);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
