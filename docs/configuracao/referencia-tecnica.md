# Referência técnica — integração Meta

Documentação para **desenvolvedores**. Configuração passo a passo → [README](README.md).

## BYOA (bring your own app)

O Iris lê credenciais de variáveis de ambiente. Cada deploy configura o seu app Meta.

| Cenário | Quem cria app | Quem conecta IG |
| ------- | ------------- | --------------- |
| Self-host | Operador do servidor | Operador no admin |
| SaaS gerenciado | Você (um app por domínio) | Cada cliente autoriza a conta dele |

## OAuth e tokens

- Fluxo principal: **Instagram Login** (`instagram_business_*`, `graph.instagram.com`).
- Token long-lived: tabela `meta_tokens` após OAuth no admin.
- Page Token (`META_PAGE_ACCESS_TOKEN`): só `take_thread_control` em `graph.facebook.com`.

## Publishing (carousel)

1. `POST /{ig-user-id}/media` — `image_url`, `is_carousel_item=true` por imagem
2. Container `media_type=CAROUSEL`, `children` = ids
3. `POST /{ig-user-id}/media_publish`
4. Opcional: `scheduled_publish_time` (Unix)

## Comments

- Webhook field: `comments`
- Reply: `POST /{comment-id}/replies?message=...`
- Sync por post: `POST /api/posts/:id/comments/sync`

## Insights

| Fluxo | Endpoint |
| ----- | -------- |
| Por post | `GET /api/posts/:id/insights` |
| Lote | `POST /api/insights/refresh-all` |
| Conta | `GET /api/insights/account` |

## Webhook verification

- `GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
- `POST`: `X-Hub-Signature-256` com app secret

## DMs — thread control

| Camada | Config | Código |
| ------ | ------ | ------ |
| Receptor primário | Página FB (guia 06) | Handover — webhook assume controle |
| `take_thread_control` | `META_PAGE_*` (guia 07) | `graph-api-message-sender.ts` → `takeThreadControl` |

Erro `thread_owner` (2534037) → `MetaMessageSendError`, HTTP 502, `ErrorCodes.META_THREAD_OWNER`.

## Error handling (runtime)

| Error | Action |
| ----- | ------ |
| Token expired | Reconectar; fila de posts pausa |
| Rate limit | Backoff no worker |
| Invalid media URL | Post `failed` antes do publish |

## Links internos

- [Troubleshooting](troubleshooting.md)
- `docs/07_api_contracts.md` — contratos HTTP
- `docs/08_environments.md` — variáveis de ambiente
