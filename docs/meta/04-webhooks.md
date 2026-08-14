# 04 — Webhooks

**Tempo:** ~15 min · **Quem:** quem faz deploy

## Objetivo

Meta envia comentários (e mensagens) em tempo real para o Iris.

## Pré-requisitos

- [03 — Variáveis de ambiente](03-variaveis-de-ambiente.md) aplicadas
- Iris acessível em **HTTPS** (produção ou túnel)
- `META_WEBHOOK_VERIFY_TOKEN` definido no servidor

## URLs

| Ambiente | Callback URL |
| -------- | ------------ |
| Produção | `https://SEU-DOMINIO/webhooks/meta` |
| Dev + túnel | `https://SEU-TUNEL.ngrok-free.app/webhooks/meta` |

## Passo a passo

### 1. Confirmar que o endpoint responde

```bash
curl -s "https://SEU-DOMINIO/health"
# esperado: {"ok":true}
```

### 2. Abrir Webhooks no app Meta

1. [developers.facebook.com](https://developers.facebook.com) → seu app (ex.: IGIris).
2. Menu **Webhooks** (ou produto **Instagram** → Webhooks).
3. Selecione objeto **Instagram** (ou configure subscription para Instagram).

### 3. Adicionar subscription

1. **Callback URL:** `https://SEU-DOMINIO/webhooks/meta`
2. **Verify token:** exatamente o valor de `META_WEBHOOK_VERIFY_TOKEN` no servidor.
3. Clique **Verificar e salvar**.
   - Falhou? Confira token, URL HTTPS, e se o Iris está no ar.

### 4. Inscrever campos (fields)

Marque pelo menos:

| Campo | Para quê no Iris |
| ----- | ---------------- |
| `comments` | Comentários em posts em tempo real |
| `messages` | DMs (se usar agente de mensagens) |

Salve.

### 5. Alinhar versão da API

No mesmo painel de Webhooks, note a **versão da API** (ex.: v21.0).

No servidor:

```env
META_GRAPH_API_VERSION=v21.0
```

**Deve ser a mesma versão** (ou compatível) nos dois lugares.

### 6. Testar

1. Publique um post (ou use um existente).
2. Comente no Instagram a partir de outra conta.
3. No admin Iris → **Webhooks** (ou logs): evento deve aparecer em poucos segundos.

## Dev com túnel

Quando o host do túnel mudar:

1. Atualize `IRIS_PUBLIC_BASE_URL` e `META_OAUTH_REDIRECT_URI`.
2. Atualize Callback URL no painel Meta.
3. Reinicie o Iris.

## Checklist

- [ ] Callback URL cadastrada e verificada (✓)
- [ ] Campo `comments` inscrito
- [ ] Campo `messages` inscrito (se usar DMs)
- [ ] `META_GRAPH_API_VERSION` = versão do painel
- [ ] Evento de teste recebido

## Próximo passo

→ [05 — Conectar no admin do Iris](05-conectar-instagram-admin.md)
