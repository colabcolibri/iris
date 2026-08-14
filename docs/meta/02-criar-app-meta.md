# 02 — Criar app na Meta

**Tempo:** ~20 min · **Quem:** quem faz deploy / admin do app Meta

## Objetivo

Criar o app na Meta for Developers com Instagram API e URLs do **seu** domínio.

## Antes de começar

- Domínio público do Iris (ex.: `https://iris.sergioluciano.com`) ou túnel em dev (ngrok / Cloudflare).
- Redirect URI será: `https://SEU-DOMINIO/auth/meta/callback`

## Passo a passo

### 1. Criar o app

1. Acesse [developers.facebook.com](https://developers.facebook.com) → **Meus apps** → **Criar app**.
2. Tipo: adequado para **Instagram API** / negócios (ex.: "Outro" → caso de uso com Instagram).
3. Nome do app: ex. **IGIris**.
4. Crie o app.

### 2. Adicionar Instagram API

1. No dashboard do app → **Adicionar produto** (ou menu **Instagram**).
2. Escolha **API setup with Instagram login** (Instagram Login — **não** Facebook Login para o fluxo principal do Iris).
3. Abra **Business login settings**.

### 3. Copiar credenciais Instagram

Em **Business login settings** (não use Configurações → Básico para OAuth):

| Variável Iris | Onde copiar |
| ------------- | ----------- |
| `META_INSTAGRAM_APP_ID` | Instagram App ID |
| `META_INSTAGRAM_APP_SECRET` | Instagram App Secret |

Também anote para webhooks (HMAC):

| Variável Iris | Onde copiar |
| ------------- | ----------- |
| `META_APP_ID` | Configurações → **Básico** → ID do app |
| `META_APP_SECRET` | Configurações → **Básico** → Chave secreta do app |

### 4. Cadastrar redirect URI

1. Em **Business login settings** → **OAuth redirect URIs**.
2. Adicione:
   - Produção: `https://SEU-DOMINIO/auth/meta/callback`
   - Dev (se usar túnel): `https://SEU-TUNEL.ngrok-free.app/auth/meta/callback`
3. Salve.

### 5. Scopes OAuth (permissões)

O Iris usa scopes `instagram_business_*`. Confirme no app que estão disponíveis / solicitados no login:

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_comments`
- `instagram_business_manage_insights`
- `instagram_business_manage_messages`

Para App Review depois: [08 — App Review](08-app-review.md).

### 6. Modo Development — adicionar testers

Enquanto o app não estiver **Live**:

1. App → **Funções** → **Testers do Instagram** (ou equivalente).
2. Adicione o @usuario Instagram que vai conectar no Iris.
3. No Instagram, aceite o convite de tester (notificação ou email).

### 7. Gerar verify token do webhook

No terminal:

```bash
openssl rand -hex 20
```

Guarde o valor — será `META_WEBHOOK_VERIFY_TOKEN` no passo [03](03-variaveis-de-ambiente.md).

## Checklist

- [ ] App criado (ex.: IGIris)
- [ ] Instagram API / Instagram Login habilitado
- [ ] `META_INSTAGRAM_APP_ID` e `META_INSTAGRAM_APP_SECRET` copiados
- [ ] `META_APP_ID` e `META_APP_SECRET` (Básico) anotados
- [ ] Redirect URI cadastrada com domínio correto
- [ ] Conta Instagram adicionada como tester (se Development)
- [ ] `META_WEBHOOK_VERIFY_TOKEN` gerado

## Próximo passo

→ [03 — Variáveis de ambiente](03-variaveis-de-ambiente.md)
