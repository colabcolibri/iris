# 08 — App Review

**Tempo:** variável (dias de revisão Meta) · **Quem:** dono do app Meta

## Objetivo

Sair do modo **Development** (só testers) para **Live** — qualquer conta Instagram pode autorizar o app.

## Pré-requisitos

- Roteiro [01](01-conta-instagram.md)–[05](05-conectar-instagram-admin.md) completo
- Deploy com scopes v1.9: `instagram_business_manage_insights`, `instagram_business_manage_messages`
- **Trocar conta** no header do Iris após deploy para token com scopes novos

O Iris expõe atalhos em **Configurações → Testes Meta (revisão do app)**.

## Limitação — publicação de teste

A API **não** publica com audiência restrita a um usuário. Mitigações:

- Conta Instagram **privada**, ou
- Post com legenda `[teste iris – apagar]` e **apagar no app** depois

## Passo a passo — preparar testes

### 1. Reconectar Instagram

1. Header → menu Instagram → **Trocar conta**.
2. Autorize todas as permissões novas.

### 2. Testar insights

1. **Configurações → Testar insights**.
2. Ou API: `GET /api/meta/test/insights?media_id=`

### 3. Testar mensagens

1. **Configurações → Testar mensagens**.
2. Ou API: `GET /api/meta/test/conversations?limit=5`

Se retornar `unsupported` sem Página Facebook → veja seção abaixo.

### 4. Testar publicação

1. Calendário → **Nova postagem** → 1 imagem.
2. Agende para +2 min.
3. Aguarde status `published`.
4. Apague o post no Instagram.

### 5. Testar comentários

1. Confirme evento em **Webhooks** no admin, ou
2. Responda um comentário em **Comentários**.

### 6. Submeter no painel Meta

1. [developers.facebook.com](https://developers.facebook.com) → IGIris → aba **Teste** / **App Review**.
2. Verifique contadores verdes por permissão.
3. Submeta revisão com vídeos/textos que a Meta pedir.

## Checklist por permissão

| Permissão | Obrigatória? | Como testar no Iris |
| --------- | ------------ | ------------------- |
| `instagram_business_basic` | Sim | Conectar Instagram |
| `instagram_business_content_publish` | Sim | Calendário → publicar |
| `instagram_business_manage_comments` | Sim | Webhooks + Comentários |
| `instagram_business_manage_insights` | Sim | Configurações → Testar insights |
| `instagram_business_manage_messages` | Revisão | Configurações → Testar mensagens |
| `public_profile` | Revisão | Header → Testar conexão |

## APIs de teste (admin)

| Método | Path | Descrição |
| ------ | ---- | --------- |
| GET | `/api/meta/test/insights?media_id=` | Insights; sem id usa último post publicado |
| GET | `/api/meta/test/conversations?limit=5` | Lista conversas (resumo) |

Erros: `ok: false` + `code` (`not_connected`, `no_media`, `insights_failed`, `unsupported`, `conversations_failed`).

## Se mensagens retornar `unsupported`

Contas só com Instagram Login (sem Página) podem não expor `/{ig-user-id}/conversations`:

1. Documente no formulário que o produto usa comentários; ou
2. Configure DMs com [06](06-mensagens-receptor-primario.md) + [07](07-page-access-token.md); ou
3. Use Graph API Explorer no painel Meta se exigirem chamada manual.

## Voltar ao índice

→ [README — Meta](README.md)
