#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CREDENTIALS="${IRIS_CREDENTIALS_PATH:-$ROOT/iris.credentials.json}"

resolve_from_json() {
  local key="$1"
  if [[ ! -f "$CREDENTIALS" ]]; then
    return 1
  fi
  jq -r --arg k "$key" '.[$k] // empty' "$CREDENTIALS"
}

API_URL="${IRIS_MCP_URL:-$(resolve_from_json mcpUrl || true)}"
API_URL="${API_URL:-$(resolve_from_json apiUrl || true)}"
CODE="${IRIS_MCP_CONNECTION_CODE:-$(resolve_from_json mcpConnectionCode || true)}"

if [[ -z "$API_URL" || -z "$CODE" ]]; then
  echo "error: configure mcpUrl + mcpConnectionCode in iris.credentials.json or env" >&2
  exit 1
fi

RESPONSE="$(curl -sf -X POST "${API_URL%/}/api/mcp/validate" \
  -H 'Content-Type: application/json' \
  -d "{\"connectionCode\":\"${CODE}\"}" 2>/dev/null || true)"

if echo "$RESPONSE" | jq -e '.valid == true' >/dev/null 2>&1; then
  echo "ok — MCP connection code valid (endpoint ${API_URL%/}/mcp)"
  exit 0
fi

echo "error: MCP connection check failed" >&2
exit 1
