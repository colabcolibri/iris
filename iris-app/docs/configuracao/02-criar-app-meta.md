# 02 — Criar app na Meta

**Tempo:** ~20 min · **Quem:** quem faz deploy / admin do app Meta

## O que você vai fazer neste guia

Vai criar um **app** em [developers.facebook.com](https://developers.facebook.com), habilitar **Instagram Login**, cadastrar a URL de callback do Iris e copiar os IDs/secrets que entram no `.env` (passo **03**).

Ao terminar, você tem um app Meta pronto para OAuth e webhooks — ainda em modo **Development** (só testers) até o passo **08**.

## Antes de começar

- Domínio público do Iris (ex.: `https://iris.seudominio.com`) **ou** túnel HTTPS em dev (ngrok, Cloudflare Tunnel).
- Anote o domínio base — a redirect URI será sempre:
  - `https://SEU-DOMINIO/auth/meta/callback`

## Passo 1 — Criar o app

1. Acesse [developers.facebook.com](https://developers.facebook.com) e faça login.
2. **Meus apps** → **Criar app**.
3. Escolha tipo adequado a **Instagram / negócios** (ex.: “Outro” → caso de uso com Instagram).
4. Nome sugerido: algo que identifique o deploy (ex.: **IGIris**).
5. Clique em **Criar app** e aguarde o dashboard abrir.

**Como saber que deu certo:** você vê o painel do app com menu lateral (Produtos, Configurações, etc.).

## Passo 2 — Adicionar Instagram API (Instagram Login)

1. No dashboard → **Adicionar produto** (ou menu **Instagram**).
2. Escolha **API setup with Instagram login** — use **Instagram Login**, não Facebook Login como fluxo principal do Iris.
3. Abra **Business login settings** (configurações de login comercial).

**Como saber que deu certo:** aparecem campos **Instagram App ID** e **Instagram App Secret**.

## Passo 3 — Copiar credenciais (guarde em local seguro)

### Para OAuth do Instagram (login no admin)

Em **Business login settings**:

| Variável no Iris | Onde copiar no painel |
| ---------------- | --------------------- |
| `META_INSTAGRAM_APP_ID` | **Instagram App ID** |
| `META_INSTAGRAM_APP_SECRET` | **Instagram App Secret** |

> **Atenção:** não confunda com o “App ID” de **Configurações → Básico** — são campos diferentes.

### Para webhooks (HMAC)

Em **Configurações → Básico** do app:

| Variável no Iris | Onde copiar |
| ---------------- | ----------- |
| `META_APP_ID` | ID do app (Básico) |
| `META_APP_SECRET` | Chave secreta do app (Básico) |

## Passo 4 — Cadastrar redirect URI

1. Volte em **Business login settings** → **OAuth redirect URIs**.
2. Adicione **exatamente** (troque o domínio):
   - Produção: `https://SEU-DOMINIO/auth/meta/callback`
   - Dev com túnel: `https://SEU-TUNEL.ngrok-free.app/auth/meta/callback`
3. **Salve**.

**Como saber que deu certo:** a URI aparece na lista, sem erro de validação.

## Passo 5 — Conferir permissões (scopes)

O Iris pede estas permissões no login (scopes `instagram_business_*`):

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_comments`
- `instagram_business_manage_insights`
- `instagram_business_manage_messages`

Não precisa marcar tudo manualmente agora — o OAuth do Iris solicita no passo **05**. Para produção pública, veja o passo **08** (App Review).

## Passo 6 — Adicionar testers (modo Development)

Enquanto o app **não** estiver Live, só contas **tester** conectam.

1. No app → **Funções** → **Testers do Instagram** (ou equivalente).
2. Adicione o **@usuario** Instagram que vai conectar no Iris.
3. No Instagram (app ou web), **aceite o convite** de tester.

**Como saber que deu certo:** o @usuario aparece como tester aceito no painel Meta.

## Passo 7 — Gerar token de verificação do webhook

No terminal do seu computador:

```bash
openssl rand -hex 20
```

Copie a saída — será a variável `META_WEBHOOK_VERIFY_TOKEN` no passo **03** e no painel Meta no passo **04**.

## Checklist final

- [ ] App criado no developers.facebook.com
- [ ] Instagram Login / API habilitado
- [ ] `META_INSTAGRAM_APP_ID` e `META_INSTAGRAM_APP_SECRET` copiados
- [ ] `META_APP_ID` e `META_APP_SECRET` (Básico) anotados
- [ ] Redirect URI cadastrada com o domínio correto
- [ ] Conta Instagram adicionada como tester (se Development)
- [ ] `META_WEBHOOK_VERIFY_TOKEN` gerado

## Próximo passo

→ [03 — Variáveis de ambiente](03-variaveis-de-ambiente.md)
