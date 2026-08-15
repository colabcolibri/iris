# Troubleshooting — Meta / Instagram

Sintoma → causa provável → **qual guia refazer**.

---

## OAuth / conexão

| Sintoma | Causa | Solução |
| ------- | ----- | ------- |
| Redirect URI mismatch | URL não cadastrada no app | [02 — Criar app](02-criar-app-meta.md) passo 4 |
| "App não disponível" | Conta não é tester (modo Development) | [02](02-criar-app-meta.md) passo 6 ou [08 — App Review](08-app-review.md) |
| Conectou mas sem insights/mensagens | Token antigo sem scopes novos | [05](05-conectar-instagram-admin.md) → Trocar conta |
| `META_INSTAGRAM_APP_ID` errado | Usou App ID de Básico em vez de Instagram | [02](02-criar-app-meta.md) passo 3 |

---

## Webhooks

| Sintoma | Causa | Solução |
| ------- | ----- | ------- |
| Verificação falha | `META_WEBHOOK_VERIFY_TOKEN` diferente do painel | [03](03-variaveis-de-ambiente.md) + [04](04-webhooks.md) |
| Comentário não chega | Campo `comments` não inscrito | [04](04-webhooks.md) passo 4 |
| DM não chega | Campo `messages` não inscrito | [04](04-webhooks.md) passo 4 |
| Eventos estranhos / campos faltando | Versão API diferente | Alinhar `META_GRAPH_API_VERSION` com painel Webhooks |

---

## DMs — envio

| Sintoma | Causa | Solução |
| ------- | ----- | ------- |
| `not the thread owner` (2534037) no fluxo normal | App não é receptor primário | [06 — Receptor primário](06-mensagens-receptor-primario.md) |
| `not the thread owner` após resposta no celular | Thread no app nativo Instagram | [07 — Page Access Token](07-page-access-token.md) ou cliente manda nova mensagem |
| `#210` page access token required | `META_PAGE_ACCESS_TOKEN` não é Page Token | [07](07-page-access-token.md) passos 5–6 |
| `take_thread_control` nem aparece nos logs | `META_PAGE_*` ausentes no ambiente | [07](07-page-access-token.md) passo 7 + redeploy |
| Token `SYSTEM_USER` no `debug_token` | Gerou token sem `pages_messaging` / sem Página | [07](07-page-access-token.md) do passo 2 |

---

## Publicação

| Sintoma | Causa | Solução |
| ------- | ----- | ------- |
| Post fica `failed` | URL de mídia inacessível pela Meta | `IRIS_PUBLIC_BASE_URL` HTTPS; [03](03-variaveis-de-ambiente.md) |
| Token expired | OAuth expirou | [05](05-conectar-instagram-admin.md) → Trocar conta |

---

## Mensagem exibida no Iris

> Esta conversa foi respondida pelo app do Instagram e está temporariamente bloqueada…

**Significa:** `take_thread_control` falhou ou não está configurado. Siga [07](07-page-access-token.md). Atalho sem config: cliente envia nova mensagem.

---

## Validar token de Página rapidamente

```bash
curl -s "https://graph.facebook.com/debug_token?input_token=TOKEN&access_token=APP_ID|APP_SECRET" \
  | jq '.data | {type, is_valid, scopes}'
```

Esperado: `is_valid: true`, `pages_messaging` nos scopes, `type: PAGE`.

---

## Voltar ao roteiro completo

→ [README — Meta](README.md)
