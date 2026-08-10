# Credentials contract

File: **`iris.credentials.json`** next to this README (root of `iris-agent/`).

| Field | Required | Description |
| ----- | -------- | ----------- |
| `apiUrl` | yes | Base URL of Iris server (no trailing slash) |
| `agentToken` | yes | Same as `IRIS_AGENT_TOKEN` in `iris-app/.env` |
| `mcpUrl` | no | Base URL for MCP (same host as `apiUrl`, no `/mcp` suffix) |
| `mcpConnectionCode` | no | Same as `IRIS_MCP_CONNECTION_CODE` in `iris-app/.env` — for MCP clients |
| `insecureAllowHttp` | dev | `true` only for `http://127.0.0.1` or `localhost` in development |
| `publicationsDir` | no | Default `./publications` relative to iris-agent root |

## Security

- File is gitignored — never commit.
- Production: use `https://` in `apiUrl`.
- Do not log `agentToken` in chat or shell history.

## Test connection

```bash
API_URL=$(jq -r .apiUrl iris.credentials.json)
TOKEN=$(jq -r .agentToken iris.credentials.json)
curl -sf -H "Authorization: Bearer ${TOKEN}" "${API_URL}/api/posts?limit=1"
```

If `jq` is unavailable, read the JSON with the Read tool and construct the curl command manually.

## MCP (optional)

For Cursor, ChatGPT, or Claude Desktop — not used by push-publication directly. See skill `mcp-connection` or `docs/architecture/mcp-integration.md`.

```bash
./scripts/iris-mcp-check.sh
```
