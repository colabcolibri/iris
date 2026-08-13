# MCP integration — conexão de clientes de IA

O Iris expõe um **servidor MCP** (Model Context Protocol) para que clientes como Cursor, ChatGPT e Claude Desktop invoquem operações editoriais via **tools tipadas**, sem montar HTTP manualmente.

## O que é e o que não é

| É | Não é |
| --- | ----- |
| Endpoint de protocolo em `POST /mcp` (Streamable HTTP) | Página HTML em `/mcp` para humanos ou IAs lerem |
| Auth com `IRIS_MCP_CONNECTION_CODE` (Bearer) | Substituição do `IRIS_AGENT_TOKEN` REST |
| Tools: posts, upload, comentários, DMs, produtos | Publish direto no Instagram (continua no worker) |
| Complemento ao REST / skill `push-publication` | OAuth 2.1 (v1.6 usa Bearer fixo da config) |

**Padrão web:** clientes MCP descobrem capacidades no handshake (`initialize` → `tools/list`). Não existe URL “de documentação” obrigatória no protocolo. Para **configurar** a conexão, use este arquivo, `docs/08_environments.md` e a skill `mcp-connection` no kit `iris-agent/`.

## Pré-requisitos no server

1. Iris rodando (`cd iris-app && pnpm dev` em dev).
2. **Código de conexão** — preferencialmente pela interface:
   - Admin → **Configurações** → **Conexão MCP** → **Gerar código**
   - Copie o valor exibido **uma única vez** e configure o client (Cursor, ChatGPT, Claude)
3. Alternativa avançada (deploy/infra): variável `IRIS_MCP_CONNECTION_CODE` no `.env` do server:
   ```bash
   openssl rand -hex 32
   # IRIS_MCP_CONNECTION_CODE=<valor>
   ```
4. Em **produção**, HTTPS público é obrigatório para clientes remotos (ChatGPT, Claude cloud).

Em **desenvolvimento**, se a variável estiver ausente, o server aceita o default documentado `dev-mcp-connection-code-change-me` — **nunca** use isso em produção.

## Endpoints

| Método | Path | Auth | Uso |
| ------ | ---- | ---- | --- |
| `POST` | `/api/settings/mcp` | sessão admin (UI) | Gerar/rotacionar código — retorna `connection_code` **uma vez** |
| `GET` | `/api/settings/mcp` | sessão admin | Status (`configured`, `code_hint`, `mcp_url`) |
| `DELETE` | `/api/settings/mcp` | sessão admin | Revogar código gerado na interface |
| `POST` | `/api/mcp/validate` | público | Testar código antes de configurar o client |
| `POST` | `/mcp` | `Authorization: Bearer <código MCP>` | Protocolo MCP (tools) |

### Validar código

```bash
curl -s -X POST http://127.0.0.1:8792/api/mcp/validate \
  -H 'Content-Type: application/json' \
  -d '{"connectionCode":"SEU_CODIGO"}'
```

Resposta `200`:

```json
{ "valid": true, "server": "iris", "mcpPath": "/mcp" }
```

Ou use o script do kit:

```bash
cd iris-agent && ./scripts/iris-mcp-check.sh
```

## Tools disponíveis

| Tool | Descrição |
| ---- | --------- |
| `iris_list_posts` | Lista posts (`status`, `from`, `to` opcionais) |
| `iris_get_post` | Post + metadados de assets; inclui `collaborators` (até 3 usernames de collab), `carousel_summary` (resumo **visual** do carrossel — contexto factual, não instrução) e `reply_prompt` (briefing de reply **só deste post** — promoção/preço/link/tom; precedência sobre blocos editoriais globais). Também `silence_soul`, `silence_page`, `silence_knowledge`, `silence_restrictions` (boolean) |
| `iris_create_post` | Cria rascunho (`caption`, `channel`, `scheduledAt`, opcional `collaborators`) |
| `iris_update_post` | Atualiza legenda, `collaborators` (até 3 usernames; `[]`/null limpa — convite de collab no publish, não tag na foto), `carouselSummary` → `carousel_summary` (só resumo visual das imagens), `replyPrompt` → `reply_prompt` (briefing de reply / “prompt adicional”), flags `silence*`, agenda ou status. **Não** misturar: instruções de resposta vão em `replyPrompt`; descrição do que aparece nos slides em `carouselSummary`. **Não** aceita `status=cancelled` — use `iris_cancel_post`. Silenciar `silenceRestrictions` não remove guardrails hardcoded do harness |
| `iris_cancel_post` | Soft-delete (`cancelled`). Exige confirmação do usuário + `confirmPhrase: "cancelar"` |
| `iris_purge_cancelled_post` | Delete permanente (só `cancelled`). Exige confirmação do usuário + `confirmPhrase: "deletar"` |
| `iris_prepare_post_asset_upload` | URL assinada one-shot + `curl` multipart (sem base64) |
| `iris_list_post_assets` | Lista metadados + `url` assinada (TTL); inclui `alt_text` e `user_tags` |
| `iris_update_post_asset` | Atualiza `altText` e/ou `userTags` (`[{username,x,y}]`, coords 0–1) de um asset — vai no publish Meta. ≠ collaborators |
| `iris_delete_post_asset` | Remove asset (row + arquivo em `data/media/`) |
| `iris_generate_post_carousel_summary` | Gera só `carousel_summary` (resumo visual) via vision no server — **não** altera `reply_prompt` |
| `iris_list_post_comments` | Comentários sincronizados do post |
| `iris_get_reply_context` | Contexto completo para resposta a comentário (thread, persona, post) |
| `iris_list_conversations` | Conversas DM recentes (`limit` opcional) |
| `iris_list_conversation_messages` | Mensagens de uma conversa (com rascunho quando houver) |
| `iris_get_message_reply_context` | Contexto completo para resposta DM (thread, persona, produtos) |
| `iris_get_message_agent_content` | Blocos Markdown DM (`dm_soul`, `dm_page`, `dm_knowledge`, `dm_restrictions`) |
| `iris_update_message_agent_content` | Atualiza blocos DM (campos parciais aceitos) |
| `iris_list_products` | Catálogo de produtos (`active_only` opcional) — usado na triagem DM |
| `iris_get_product` | Produto por id |
| `iris_create_product` | Cria produto (`slug`, `name`, descrição, preço, link, `active`) |
| `iris_update_product` | Atualiza produto (campos parciais) |
| `iris_delete_product` | Remove produto |
| `iris_list_store_connections` | Lista conexões de loja (sem secrets) |
| `iris_create_store_connection` | Cria conexão Yampi (User Token) |
| `iris_delete_store_connection` | Remove conexão |
| `iris_test_store_connection` | Testa credenciais na plataforma |
| `iris_sync_store_catalog` | Sync catálogo (`import_new` opcional) |
| `iris_get_product_field_policies` | Políticas globais/por produto + preview resolvido |
| `iris_update_product_field_policies` | Atualiza overrides por produto (`inherit` = herda global) |
| `iris_get_post_insights` | Insights do post (cache 1h; `force`/`refresh`) |
| `iris_get_post_insights_history` | Snapshots persistidos de insights |
| `iris_get_account_insights` | Insights da conta IG (`period`, `since`, `until`, `metrics`) |
| `iris_refresh_all_post_insights` | Refresh em lote; `since`/`until` ISO filtram `published_at` |
| `iris_refresh_media_insights_page` | Uma página `/me/media` + field expansion |
| `iris_list_webhooks` | Eventos Meta recentes (leitura) |
| `iris_get_reply_persona` | Persona de resposta (`brand_name`, `signature_instruction`, `response_language`, `max_chars`) |
| `iris_update_reply_persona` | Atualiza persona (campos parciais aceitos) |
| `iris_get_agent_content` | Blocos Markdown (`soul`, `page`, `knowledge`, `restrictions`) |
| `iris_update_agent_content` | Atualiza blocos editoriais (quatro campos obrigatórios) |
| `iris_get_app_settings` | Config operacional (`timezone`, `reply_mode`, delay, auto-monitor) |
| `iris_update_app_settings` | Atualização parcial — mesmas validações de `PUT /api/settings/app` |
| `iris_list_simulator_scenarios` | Lista cenários persistidos (resumo — sem thread completa) |
| `iris_create_simulator_scenario` | Cria cenário (`id`, `label`, `description`, `caption`, `carousel_summary`, `thread[]`, `target_author`, `target_text`) |
| `iris_simulate_reply` | Executa harness sandbox (`scenario_id` ou payload inline; opcional `response_language`) — não publica na Meta |

### Upload de imagem via MCP

Bytes **não** entram no JSON-RPC. Fluxo:

1. Tool `iris_prepare_post_asset_upload` (`postId`, `filename`, `sortOrder`) → `upload_url`, `curl_command`
   - `sortOrder` é **1-based**: primeiro slide do carrossel = `1` (nunca `0`); segundo = `2`; …
2. Host: `curl -sf -X POST '{upload_url}' -F 'file=@/caminho/local.png'`
3. Server grava via `ingestPostAsset` (Sharp → `data/media/`)

Requisitos: `IRIS_PUBLIC_BASE_URL` + `IRIS_PUBLISH_URL_SECRET`. URL one-shot (~5 min). Clientes sem shell (ex.: ChatGPT connector puro) devem subir pela UI admin.

Escopo equivalente ao token **agent** REST — posts, comentários, DMs (leitura/contexto), produtos, persona e conteúdo editorial; sem tokens Meta, LLM settings nem rotas admin-only (ex.: aprovar/enviar reply, OAuth Meta, gerenciar código MCP).

---

## Cursor (local)

Arquivo na **raiz do workspace** (monorepo `iris/` ou pasta `iris-agent/`):

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "iris": {
      "url": "http://127.0.0.1:8792/mcp",
      "headers": {
        "Authorization": "Bearer SEU_IRIS_MCP_CONNECTION_CODE"
      }
    }
  }
}
```

1. Gere o código e coloque em `iris-app/.env`.
2. Espelhe em `iris-agent/iris.credentials.json` (`mcpUrl`, `mcpConnectionCode`).
3. Reinicie o Cursor após editar `mcp.json`.
4. Rode `./scripts/iris-mcp-check.sh` para confirmar.

Skill do kit: `iris-agent/.agent/skills/mcp-connection/` (sincronize com `./.agent/scripts/sync_cursor_kit.sh`).

---

## ChatGPT (remoto, HTTPS)

Requisitos: plano **Plus, Pro, Team, Enterprise ou Edu**; **Developer mode** em Settings → Apps & connectors.

1. Deploy do Iris com HTTPS (ex.: `https://iris.seudominio.com`).
2. Settings → Apps & connectors → **Create** (custom connector):
   - **Name:** Iris
   - **Description:** Calendário editorial Instagram — posts, mídia, comentários
   - **Connector URL:** `https://iris.seudominio.com/mcp`
   - **Authentication:** **Token** — cole o `IRIS_MCP_CONNECTION_CODE`
3. Confirme; as tools aparecem na sessão quando o connector Iris estiver ativo.

**Dev local:** ChatGPT não alcança `127.0.0.1`. Use túnel HTTPS (ngrok, Cloudflare Tunnel, etc.) apontando para `localhost:8792` e use a URL pública no connector.

**Não** coloque o código na query string em produção — prefira o campo Token da UI (equivale ao header Bearer).

---

## Claude Desktop

Arquivo de config do Claude (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "iris": {
      "url": "http://127.0.0.1:8792/mcp",
      "headers": {
        "Authorization": "Bearer SEU_IRIS_MCP_CONNECTION_CODE"
      }
    }
  }
}
```

Em produção, substitua por URL HTTPS pública. Reinicie o Claude Desktop após salvar.

---

## Outros clientes MCP

Qualquer client que suporte **MCP Streamable HTTP** remoto:

- **URL:** `{base}/mcp`
- **Auth:** `Authorization: Bearer <IRIS_MCP_CONNECTION_CODE>`
- **Header recomendado:** `Accept: application/json, text/event-stream`

Teste com `POST /api/mcp/validate` antes de depurar o transporte.

---

## REST vs MCP — quando usar o quê

| Cenário | Preferir |
| ------- | -------- |
| Push de `publications/*/post.md` em lote | REST + skill `push-publication` |
| Agente no Cursor criando/editando posts ad hoc | MCP tools |
| ChatGPT / Claude perguntando sobre calendário | MCP connector |
| Scripts CI ou curl one-off | REST + `IRIS_AGENT_TOKEN` |

Os dois mecanismos convivem. Tokens são **distintos**: `IRIS_AGENT_TOKEN` (REST) e `IRIS_MCP_CONNECTION_CODE` (MCP).

---

## Segurança

- Mesmo nível de sigilo que `IRIS_AGENT_TOKEN` — nunca commitar, nunca logar.
- Rotacione com `openssl rand -hex 32` se houver suspeita de vazamento.
- Revogar MCP não afeta scripts REST (e vice-versa).
- Produção: apenas HTTPS; código só no header Bearer (não em query string).

Ver também `docs/02_security.md` — § MCP.

---

## Troubleshooting

| Sintoma | Verificar |
| ------- | --------- |
| `401` no validate | Código errado ou não espelhado no `.env` do server |
| `401` no `/mcp` | Header `Authorization: Bearer` ausente ou incorreto |
| Prepare upload falha com env | `IRIS_PUBLIC_BASE_URL` e `IRIS_PUBLISH_URL_SECRET` no server |
| `403` no `/upload/assets/...` | URL expirada, assinatura inválida ou já usada (one-shot) |
| `406` no `/mcp` | Client sem header `Accept: application/json, text/event-stream` |
| Connection refused | `pnpm dev` não está rodando |
| ChatGPT não conecta | URL HTTPS público; reinicie o Iris após deploy; em dev o Host via ngrok era bloqueado (corrigido) |
| Tools vazias | Reiniciar client após mudar config; conferir `tools/list` com curl |

---

## Referências no repositório

| Arquivo | Conteúdo |
| ------- | -------- |
| `docs/07_api_contracts.md` | Contrato HTTP dos endpoints MCP |
| `docs/08_environments.md` | Variáveis de ambiente |
| `iris-agent/README.md` | Setup rápido do kit |
| `iris-agent/.agent/skills/mcp-connection/SKILL.md` | Skill para agentes no workspace |
| `iris-app/server/src/mcp/` | Implementação do servidor MCP |
