# Meta app review — checklist IGIris

Guia operacional para fechar a aba **Teste** do app **IGIris** no [Meta Developers](https://developers.facebook.com/). O Iris expõe atalhos em **Configurações → Testes Meta (revisão do app)**.

## Pré-requisitos

1. App IGIris com **Instagram API** (Instagram Login) configurado.
2. Deploy com scopes v1.9 (`instagram_business_manage_insights`, `instagram_business_manage_messages`).
3. **Trocar conta** no header do Iris após o deploy para obter token com os novos scopes.
4. Conta Instagram de teste conectada (`@sergiolucianojr` ou equivalente).

## Limitação importante — publicação “privada”

A API do Instagram **não** permite publicar no feed com audiência restrita a um usuário específico. Mitigações:

- Usar conta **privada** (só seguidores aprovados veem), ou
- Publicar post com legenda `[teste iris – apagar]` e **remover no app Instagram** em seguida.

## Checklist por permissão

| Permissão Meta | Obrigatória? | Como testar no Iris | Notas |
| -------------- | ------------ | ------------------- | ----- |
| `instagram_business_basic` | Sim | Conectar Instagram | Contador sobe com uso normal |
| `instagram_business_content_publish` | Sim | Calendário → Nova postagem → agendar → worker publica | Apagar post no Instagram depois |
| `instagram_business_manage_comments` | Sim | Webhooks + Comentários | Já operacional — ver `/webhooks` |
| `instagram_business_manage_insights` | Sim | Configurações → **Testar insights** | `GET /api/meta/test/insights` |
| `instagram_business_manage_messages` | Revisão | Configurações → **Testar mensagens** | Pode retornar `unsupported` sem Page |
| `public_profile` | Revisão | Header → Instagram → **Testar conexão** | Chama `GET /me` |
| `instagram_manage_comments` (legado) | Sim | Responder comentário em `/comments` | Escopo legado do painel |
| Human Agent | Opcional | Relacionado a mensagens | Avance `manage_messages` primeiro |

## Passo a passo recomendado

1. **Reconectar** — header → menu Instagram → Trocar conta → autorizar permissões novas.
2. **Insights** — Configurações → Testar insights (usa última mídia publicada ou informe `media_id` na API).
3. **Mensagens** — Configurações → Testar mensagens.
4. **Publicação** — Calendário → Nova postagem → 1 imagem → agendar para +2 min → aguardar status `published`.
5. **Comentários** — confirmar evento em `/webhooks` ou responder em `/comments`.
6. **Painel Meta** — IGIris → Teste → verificar contadores e submeter revisão quando verde.

## APIs de teste (admin)

| Método | Path | Descrição |
| ------ | ---- | --------- |
| GET | `/api/meta/test/insights?media_id=` | Insights de uma mídia; sem `media_id` usa último post publicado |
| GET | `/api/meta/test/conversations?limit=5` | Lista conversas (resumo, sem corpo de DM) |

Respostas de erro usam `ok: false` e `code` (`not_connected`, `no_media`, `insights_failed`, `unsupported`, `conversations_failed`).

## Se mensagens retornar `unsupported`

Algumas contas com **Instagram Login** (sem Página Facebook) não expõem `/{ig-user-id}/conversations`. Nesse caso:

1. Documente no formulário de revisão que o produto usa apenas comentários, não inbox de DM.
2. Use o **Explorador da Graph API** no painel Meta com token do app, se a Meta exigir chamada manual.

## Referências

- `docs/architecture/meta-integration.md` — OAuth, publish, webhooks
- `docs/07_api_contracts.md` — contratos HTTP
- `docs/08_environments.md` — URL pública e webhook em produção
