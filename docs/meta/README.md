# Meta / Instagram — guias passo a passo

Configuração completa do Iris com a Meta, **na ordem**. Siga do **01** ao **05** na primeira vez. Os passos **06** e **07** são para DMs (mensagens diretas).

## Quem faz o quê

| Papel | Passos |
| ----- | ------ |
| **Quem faz deploy** (devops / dono do servidor) | 02, 03, 04 |
| **Quem opera o Instagram** (conecta a conta) | 01, 05 |
| **Quem configura DMs** (uma vez por Página) | 06, 07 |

Cada deploy precisa do **próprio app Meta** (BYOA) — credenciais não vêm do repositório.

## Roteiro — primeira configuração

| # | Guia | O que você faz | Terminou quando… |
| - | ---- | -------------- | ---------------- |
| 01 | [Conta Instagram profissional](01-conta-instagram.md) | Converter conta para Business ou Creator | Conta aparece como profissional no app Instagram |
| 02 | [Criar app na Meta](02-criar-app-meta.md) | App IGIris (ou seu nome), Instagram API, redirect URI, testers | App criado, Instagram App ID/Secret copiados, redirect cadastrado |
| 03 | [Variáveis de ambiente](03-variaveis-de-ambiente.md) | `.env` local e painel de produção (Railway, etc.) | Servidor sobe sem erro de config Meta |
| 04 | [Webhooks](04-webhooks.md) | URL pública, verify token, campo `comments` (e mensagens se usar DMs) | Meta mostra webhook verificado (✓) |
| 05 | [Conectar no admin do Iris](05-conectar-instagram-admin.md) | OAuth no header do admin | Header mostra @usuario conectado; publicação/comentários funcionam |

## Roteiro — mensagens (DMs)

Faça **depois** do roteiro acima, se o Iris responde DMs.

| # | Guia | O que você faz | Terminou quando… |
| - | ---- | -------------- | ---------------- |
| 06 | [Receptor primário (Handover)](06-mensagens-receptor-primario.md) | IGIris como receptor primário na Página Facebook | DM de teste responde pelo Iris sem `thread_owner` |
| 07 | [Page Access Token](07-page-access-token.md) | Token de Página com `pages_messaging` → `META_PAGE_*` | `debug_token` mostra `pages_messaging`; erro `#210` some dos logs |

## App Review (produção pública)

| # | Guia | Quando |
| - | ---- | ------ |
| 08 | [App Review](08-app-review.md) | App em modo Development só serve testers; para usuários externos, submeter revisão |

## Se algo der errado

→ [Troubleshooting](troubleshooting.md) — sintomas, causa e link para o passo certo.

## Referência técnica (desenvolvedores)

→ [Referência de integração](referencia-tecnica.md) — fluxos de publish, comments, insights, códigos de erro no código.

## Exemplo deste repositório

| Item | Valor |
| ---- | ----- |
| App Meta | IGIris |
| Página Facebook | Colibri |
| `META_PAGE_ID` | `299512127067136` |
| Produção | `https://iris.sergioluciano.com` |
| Graph API | `META_GRAPH_API_VERSION=v21.0` (igual no painel Webhooks) |

Substitua pelos seus valores em cada guia.
