# 07 — Page Access Token (DMs)

**Tempo:** ~30 min · **Quem:** admin Business Manager + deploy

## Objetivo

Configurar `META_PAGE_ID` e `META_PAGE_ACCESS_TOKEN` para o Iris recuperar conversas quando alguém respondeu pelo **app nativo do Instagram**.

O Iris chama `take_thread_control` automaticamente — você só configura as variáveis.

## Quando fazer

- Depois do [06 — Receptor primário](06-mensagens-receptor-primario.md).
- Quando logs mostram `[meta] take_thread_control failed` ou erro `#210`.
- Ao **renovar** token expirado ou revogado.

## O que NÃO colocar em `META_PAGE_ACCESS_TOKEN`

| Token | Serve? |
| ----- | ------ |
| Token do OAuth do admin (Instagram Login) | ❌ |
| Token pessoal / Graph API Explorer | ❌ |
| System User **sem** `pages_messaging` | ❌ (causa erro `#210`) |
| Page Access Token com `pages_messaging` + Página selecionada | ✅ |

---

## Passo 1 — Anotar ID da Página

1. [business.facebook.com](https://business.facebook.com) → ⚙️ **Configurações** → **Contas** → **Páginas**.
2. Abra a Página vinculada ao Instagram (ex.: **Colibri**).
3. Copie o **ID da Página**.

Exemplo Iris: `299512127067136`

Guarde para `META_PAGE_ID`.

---

## Passo 2 — Habilitar Login do Facebook para Empresas

Sem isso, `pages_messaging` **não aparece** ao gerar token.

1. [developers.facebook.com](https://developers.facebook.com) → app (ex.: **IGIris**).
2. **Login do Facebook para Empresas** (ou Adicionar produto → adicionar).
3. **Configurações** → **Criar configuração**:
   - Nome: `Iris - Thread Recovery`
   - **Ativos:** Página do Passo 1
   - **Permissões:** `pages_messaging` (+ `pages_show_list` se sugerido)
   - **Redirect URI:** `https://SEU-DOMINIO/auth/meta/callback`
4. Salvar.

---

## Passo 3 — Criar Usuário do Sistema

1. Business Manager → ⚙️ **Configurações** → **Usuários** → **Usuários do sistema**.
2. **+ Adicionar**.
3. Nome: `Iris - Thread Recovery`.
4. Função: **Employee**.

---

## Passo 4 — Atribuir usuário ao app

**Não pule** — sem isso o Passo 5 não lista permissões.

1. Configurações → **Contas** → **Apps** → app IGIris.
2. Adicione o Usuário do Sistema do Passo 3 (Employee).
3. Salvar.

---

## Passo 5 — Gerar o token

1. **Usuários do sistema** → seu usuário → **Gerar novo token**.
2. **App:** IGIris.
3. **Expiração:** máxima disponível ("Nunca expira" se possível).
4. **Permissões:** ✅ `pages_messaging` (+ `pages_show_list` se aparecer).
5. **Páginas / ativos:** ✅ selecione a Página do Passo 1.
6. **Gerar** → copie o token **agora** (só aparece uma vez).

---

## Passo 6 — Validar antes de subir

Substitua os valores e rode no terminal:

```bash
curl -s "https://graph.facebook.com/debug_token?input_token=SEU_TOKEN&access_token=META_APP_ID|META_APP_SECRET" \
  | jq '.data | {type, is_valid, scopes}'
```

| Campo | Deve ser |
| ----- | -------- |
| `is_valid` | `true` |
| `scopes` | contém `pages_messaging` |
| `type` | `PAGE` (ou granular com Página correta) |

Se aparecer `#210` em teste manual:

```bash
curl -s -X POST "https://graph.facebook.com/v21.0/SEU_PAGE_ID/take_thread_control" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient":{"id":"QUALQUER_IG_USER_ID"}}'
```

- Erro `#210` → volte ao Passo 5 (token errado).
- Outro erro → token OK; erro pode ser normal em thread de teste.

---

## Passo 7 — Colocar no servidor

**Produção** (Railway, etc.):

```env
META_PAGE_ID=299512127067136
META_PAGE_ACCESS_TOKEN=<token do Passo 5>
```

**Local:** mesmo par em `iris-app/.env`.

Reinicie / redeploy.

---

## Passo 8 — Validar no Iris

1. Alguém responde uma DM pelo **app Instagram** (celular).
2. Sem esperar nova mensagem do cliente, responda pelo Iris.
3. Deve enviar com sucesso.
4. Logs: **não** deve aparecer `take_thread_control failed ... #210`.

## Segurança

- Nunca commite o token.
- Se vazar: Business Manager → Usuário do sistema → **Anular tokens** → gere outro (Passo 5).

## Checklist

- [ ] `META_PAGE_ID` = ID da Página correta
- [ ] Token com `pages_messaging` validado (`debug_token`)
- [ ] Variáveis no Railway/produção + redeploy
- [ ] Teste pós-resposta no app nativo passou

## Voltar ao índice

→ [README — Meta](README.md)
