# 04 — Webhooks

**Tempo:** ~15 min · **Quem:** quem faz deploy

## O que você vai fazer neste guia

Vai dizer à Meta **para onde enviar** eventos de comentários (e mensagens, se usar DMs). Sem webhook verificado, comentários novos **não aparecem** no Iris em tempo real.

Ao terminar, o painel Meta mostra o webhook com **✓ verificado** e um comentário de teste chega no admin.

## Antes de começar

- [03 — Variáveis de ambiente](03-variaveis-de-ambiente.md) aplicadas e servidor **no ar**.
- Iris acessível em **HTTPS** (produção ou túnel).
- `META_WEBHOOK_VERIFY_TOKEN` já definido no servidor (mesmo valor que você vai digitar na Meta).

### URL do callback

| Ambiente | URL completa |
| -------- | ------------ |
| Produção | `https://SEU-DOMINIO/webhooks/meta` |
| Dev + túnel | `https://SEU-TUNEL.ngrok-free.app/webhooks/meta` |

## Passo 1 — Confirmar que o Iris responde

No terminal:

```bash
curl -s "https://SEU-DOMINIO/health"
```

**Resposta esperada:** `{"ok":true}`

Se falhar, corrija deploy / túnel antes de continuar — a Meta não verifica URL offline.

## Passo 2 — Abrir Webhooks no app Meta

1. [developers.facebook.com](https://developers.facebook.com) → seu app (ex.: IGIris).
2. Menu **Webhooks** (ou produto **Instagram** → Webhooks).
3. Selecione o objeto **Instagram** (subscription para Instagram).

## Passo 3 — Cadastrar e verificar o callback

1. **Callback URL:** cole `https://SEU-DOMINIO/webhooks/meta`
2. **Verify token:** cole **exatamente** o valor de `META_WEBHOOK_VERIFY_TOKEN` do servidor (passo 03).
3. Clique **Verificar e salvar**.

**Como saber que deu certo:** status **Verificado** (✓) ao lado da URL.

### Se a verificação falhar

| Causa comum | Correção |
| ----------- | -------- |
| Token diferente | Compare caractere a caractere `.env` vs painel Meta |
| URL sem HTTPS | Use túnel ou produção com TLS |
| Iris parado | `pnpm dev` / redeploy e tente de novo |

## Passo 4 — Inscrever campos (fields)

Marque e salve:

| Campo | Para quê no Iris |
| ----- | ---------------- |
| `comments` | Comentários em posts em tempo real |
| `messages` | DMs (só se for usar agente de mensagens) |

## Passo 5 — Alinhar versão da API

No painel de Webhooks, anote a **versão da API** (ex.: `v21.0`).

No servidor, confirme:

```env
META_GRAPH_API_VERSION=v21.0
```

**Deve ser a mesma** (ou compatível) nos dois lugares.

## Passo 6 — Testar com comentário real

1. Publique um post no Instagram (ou use um existente).
2. De **outra conta**, comente no post.
3. No admin Iris → área de **Webhooks** (ou logs): o evento deve aparecer em poucos segundos.

**Como saber que deu certo:** linha de evento `comments` com timestamp recente.

## Dev com túnel (URL muda)

Se o host do túnel mudar:

1. Atualize `IRIS_PUBLIC_BASE_URL` e `META_OAUTH_REDIRECT_URI` no `.env`.
2. Atualize a Callback URL no painel Meta.
3. Reinicie o Iris.

## Checklist final

- [ ] Callback URL verificada (✓)
- [ ] Campo `comments` inscrito
- [ ] Campo `messages` inscrito (se usar DMs)
- [ ] `META_GRAPH_API_VERSION` = versão do painel
- [ ] Comentário de teste recebido no Iris

## Próximo passo

→ [05 — Conectar no admin do Iris](05-conectar-instagram-admin.md)
