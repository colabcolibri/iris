---
name: mcp-connection
description: Configura e valida conexão MCP do Iris em Cursor, ChatGPT, Claude e outros clients — código, URLs e check via API.
---

# MCP connection (Iris)

Guia canônico completo: `docs/architecture/mcp-integration.md` (no monorepo `iris/docs/`).

## Quando usar

- Conectar um **client MCP** (Cursor, ChatGPT, Claude Desktop) ao Iris.
- Validar `IRIS_MCP_CONNECTION_CODE` antes de debugar transporte ou tools.
- Explicar ao operador como configurar connector remoto (HTTPS).

Para push de `publications/` em lote, use **REST** + skill `push-publication` — MCP e REST convivem.

## Passo 0 — server e código

1. Server: `cd iris-app && pnpm dev` (dev) ou deploy HTTPS (prod).
2. Gerar código:
   ```bash
   openssl rand -hex 32
   ```
3. Colar em `iris-app/.env`:
   ```
   IRIS_MCP_CONNECTION_CODE=<valor>
   ```
4. Espelhar em `iris.credentials.json`:
   ```json
   {
     "mcpUrl": "http://127.0.0.1:8792",
     "mcpConnectionCode": "<mesmo-valor>"
   }
   ```

## Check (sempre antes de configurar client)

```bash
cd iris-agent
./scripts/iris-mcp-check.sh
# ok — MCP connection code valid
```

## Cursor

`.cursor/mcp.json` na raiz do workspace:

```json
{
  "mcpServers": {
    "iris": {
      "url": "http://127.0.0.1:8792/mcp",
      "headers": {
        "Authorization": "Bearer SEU_CODIGO"
      }
    }
  }
}
```

Reiniciar Cursor após salvar.

## ChatGPT

1. Plano pago + Developer mode (Settings → Apps & connectors).
2. Create connector:
   - URL: `https://SEU_DOMINIO/mcp` (HTTPS obrigatório)
   - Auth: **Token** = `IRIS_MCP_CONNECTION_CODE`
3. Dev local: túnel HTTPS (ngrok etc.) — ChatGPT não acessa `127.0.0.1`.

## Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "iris": {
      "url": "http://127.0.0.1:8792/mcp",
      "headers": {
        "Authorization": "Bearer SEU_CODIGO"
      }
    }
  }
}
```

Reiniciar Claude Desktop.

## Tools MCP

| Tool | Uso |
| ---- | --- |
| `iris_list_posts` | Calendário / lista |
| `iris_get_post` | Detalhe + assets |
| `iris_create_post` | Novo rascunho |
| `iris_update_post` | Legenda / agenda / status |
| `iris_upload_post_asset` | Imagem em base64 |
| `iris_list_post_comments` | Comentários do post |

## Troubleshooting

| Sintoma | Ação |
| ------- | ---- |
| `401` no check | Corrigir código no `.env` e credentials |
| Connection refused | Subir `pnpm dev` no `iris-app` |
| ChatGPT falha | URL HTTPS pública; não localhost |
| Tools não aparecem | Reiniciar client; ver `docs/architecture/mcp-integration.md` |
