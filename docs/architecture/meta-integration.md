# Meta integration

## Quem cria o app Meta?

O Iris lê credenciais de variáveis de ambiente (`META_INSTAGRAM_APP_ID`, `META_INSTAGRAM_APP_SECRET`, …). O código **não** embute app da Meta — cada deploy configura o seu.

| Cenário | Quem cria o app Meta | Quem conecta o Instagram |
| ------- | -------------------- | ------------------------ |
| **Self-host** (você ou outra pessoa faz deploy do repo) | **Quem opera aquele servidor** — um app por instância/domínio | Operador do Iris clica em conectar no admin |
| **Hospedado por você** (SaaS ou instância gerenciada) | **Você** — um app para o seu domínio | Cada cliente só autoriza a conta IG dele |

### Self-host = bring your own app (BYOA)

Cada pessoa que roda o Iris em **outro domínio** precisa do **próprio** app na [Meta for Developers](https://developers.facebook.com/). Motivos:

1. **Redirect URI** — a Meta só aceita URLs cadastradas no app. `https://iris-do-joao.com/auth/meta/callback` não funciona com o app de outra pessoa.
2. **Segredo** — `META_INSTAGRAM_APP_SECRET` nunca vai para o git. Compartilhar o secret no repositório abre o fluxo OAuth para abuso.
3. **App Review** — app em *Development* serve para testers; produção com usuários externos exige revisão no app **daquele** operador.

Open source no GitHub + instância hospedada sua é um modelo válido: o código é público; as credenciais Meta ficam só no servidor de quem hospeda.

### O que o operador **não** precisa fazer

- Criar app Meta (só quem faz deploy)
- Ter Facebook Business Manager (não obrigatório no fluxo Instagram Login do Iris)
- Vincular Página do Facebook (Instagram Login cobre o v1 sem Page)

O operador só precisa de conta Instagram **Business ou Creator** e autorizar o app já configurado no servidor.

## Prerequisites

- Instagram Business ou Creator account
- Meta Developers app com **Instagram API** (Instagram Login)
- **Instagram App ID** e **Instagram App Secret** (em Dashboard → Instagram → API setup with Instagram login → Business login settings) — **não** use o App ID de Configurações → Básico
- Redirect URI cadastrado em **Business login settings → OAuth redirect URIs**
- OAuth scopes:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
  - `instagram_business_manage_comments`
  - `instagram_business_manage_insights` (revisão app v1.9)
  - `instagram_business_manage_messages` (revisão app v1.9)
- Após atualizar scopes em produção, o operador deve **Trocar conta** no header para obter token novo.
- Checklist completo de revisão: `docs/architecture/meta-app-review.md`
- Long-lived Instagram user access token stored server-side (`meta_tokens` table)
- **Não** exige Página do Facebook

## Setup rápido (self-host)

### 1. Conta Instagram

Converta a conta para **Profissional** (Business ou Creator) nas configurações do app Instagram.

### 2. App na Meta

1. Acesse [developers.facebook.com](https://developers.facebook.com) → **Criar app** → tipo adequado para Instagram API.
2. No dashboard do app: **Instagram** → **API setup with Instagram login**.
3. Em **Business login settings**, copie **Instagram App ID** e **Instagram App Secret** (não use o App ID de *Configurações → Básico*).
4. Em **OAuth redirect URIs**, cadastre:
   - Dev com túnel: `https://<seu-ngrok>.ngrok-free.app/auth/meta/callback`
   - Produção: `https://<seu-dominio>/auth/meta/callback`
5. Adicione sua conta Instagram como **tester** do app enquanto estiver em modo *Development*.

### 3. Variáveis no Iris

No `iris-app/.env` (ou painel do provedor em produção):

```env
IRIS_PUBLIC_BASE_URL=https://seu-dominio
META_INSTAGRAM_APP_ID=...
META_INSTAGRAM_APP_SECRET=...
META_OAUTH_REDIRECT_URI=https://seu-dominio/auth/meta/callback
META_WEBHOOK_VERIFY_TOKEN=um-token-aleatorio-longo
META_GRAPH_API_VERSION=v21.0
IRIS_TOKEN_ENCRYPTION_KEY=64-char-hex-ou-passphrase-longa
```

Para HMAC de webhooks, configure também `META_APP_ID` e `META_APP_SECRET` (App ID de *Configurações → Básico* do mesmo app).

### 4. Webhook (comentários em tempo real)

1. URL pública HTTPS: `https://<seu-dominio>/webhooks/meta`
2. Meta Developers → **Webhooks** → produto Instagram → campo `comments`
3. **Verify token** = mesmo valor de `META_WEBHOOK_VERIFY_TOKEN`

Requer URL pública; em dev use ngrok ou Cloudflare Tunnel e atualize redirect + webhook quando o host mudar.

### 5. Conectar no admin

1. Suba o Iris com as variáveis acima.
2. No admin → conectar Instagram (OAuth).
3. Em **Configurações → Testes Meta**, valide insights/comentários se for submeter App Review.

Sem Meta configurado, o restante do Iris funciona (calendário, MCP, OTP); publicação e sync de comentários ficam indisponíveis até conectar.

## Modo Development vs App Review

| Modo | Quem pode conectar | Quando usar |
| ---- | ------------------ | ----------- |
| **Development** | Contas adicionadas como testers no app Meta | Dev local, uso pessoal, homologação |
| **Live** (após App Review) | Qualquer conta IG que autorize o app | Produção com operadores externos |

Guia operacional de revisão: `docs/architecture/meta-app-review.md`.

## Publishing flow (carousel)

1. For each image URL in `post_assets`: `POST /{ig-user-id}/media` with `image_url`, `is_carousel_item=true`
2. Create carousel container with `media_type=CAROUSEL`, `children` = container ids
3. `POST /{ig-user-id}/media_publish` with container id
4. Optional: `scheduled_publish_time` (Unix) when scheduling via API

## Comments

- Subscribe webhook field: `comments`
- On event: extract `media_id`, `comment_id`, `text`, `username`, `parent_id`
- Match `posts.ig_media_id` → link `comments.post_id`
- Reply: `POST /{comment-id}/replies?message=...`
- Per-post sync: `POST /api/posts/:id/comments/sync` pulls comments for one `ig_media_id` and upserts into SQLite
- Legacy inbox sync: `GET /api/comments/inbox` — avoid for routine use; prefer per-post sync or webhook ingest

## Insights

| Fluxo | Endpoint / MCP | Custo Meta | Uso |
| ----- | -------------- | ---------- | --- |
| Por post (cache 1h) | `GET /api/posts/:id/insights` / `iris_get_post_insights` | 1 call se miss | Detalhe |
| Lote 1:1 (throttle) | `POST /api/insights/refresh-all` / `iris_refresh_all_post_insights` | N calls | Backfill; opcional `since`/`until` em `published_at` |
| Página sob demanda | `POST /api/insights/refresh-media-page` / `iris_refresh_media_insights_page` | ~1 call/página | Atualizar posts gerenciados via `/me/media?fields=insights.metric(...)` |
| Conta | `GET /api/insights/account` / `iris_get_account_insights` | 1 call | Métricas da conta (`period`, `since`, `until`); sem snapshot SQLite nesta versão |

Mídia: métricas lifetime no endpoint por-id — filtros de data na query do post são no-op. Conta: usa `period` + janela Meta.

## Webhook verification

- `GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
- `POST`: validate `X-Hub-Signature-256` with app secret

## Error handling

| Error | Action |
| ----- | ------ |
| Token expired | Alert operador; posts queue paused |
| Rate limit | Exponential backoff in worker |
| Invalid media URL | Post `failed` before publish attempt |
