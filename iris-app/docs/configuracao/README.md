# Guia de configuração — Meta / Instagram

> **Documentação interna** — não publicada em `/docs/`. O site público contém apenas o [guia de uso](../uso/). Este material é para o time que faz deploy e integração Meta.

Como **deixar o Iris funcionando** com a Meta/Instagram. **Siga na ordem** na primeira vez: do **01** ao **05**. Os passos **06** e **07** só se você for usar **DMs** (mensagens diretas).

**Já tem o Iris no ar?** Para usar o admin no dia a dia (postagens, comentários, DMs), veja o [guia de uso](../uso/).

## Quem faz o quê

| Papel | O que essa pessoa faz | Passos |
| ----- | --------------------- | ------ |
| **Operador Instagram** | Converte a conta, conecta no admin | 01, 05 |
| **Quem faz deploy** | Cria app Meta, `.env`, webhooks | 02, 03, 04 |
| **Quem configura DMs** | Handover + token de Página (uma vez) | 06, 07 |

Cada instalação do Iris usa o **próprio app Meta** (BYOA). Credenciais não vêm do repositório.

## Roteiro — primeira configuração

Só avance para o próximo quando o passo atual estiver **verde** no checklist do guia.

| # | Guia | Resumo | Terminou quando… |
| - | ---- | ------ | ---------------- |
| 01 | [Conta Instagram profissional](01-conta-instagram.md) | Converter para Business ou Creator | No app, a conta aparece como **profissional** |
| 02 | [Criar app na Meta](02-criar-app-meta.md) | App + Instagram Login + redirect | App criado, IDs copiados, redirect cadastrado |
| 03 | [Variáveis de ambiente](03-variaveis-de-ambiente.md) | Colocar secrets no servidor | `pnpm dev` / deploy sobe sem erro de Meta |
| 04 | [Webhooks](04-webhooks.md) | Meta avisa comentários em tempo real | Painel Meta mostra webhook **verificado (✓)** |
| 05 | [Conectar no admin](05-conectar-instagram-admin.md) | OAuth pelo header do Iris | Header mostra **@usuario** conectado |

## Roteiro — mensagens (DMs)

Opcional. Faça **depois** do roteiro acima.

| # | Guia | Resumo | Terminou quando… |
| - | ---- | ------ | ---------------- |
| 06 | [Receptor primário](06-mensagens-receptor-primario.md) | App como dono da conversa | DM de teste responde sem erro `thread_owner` |
| 07 | [Page Access Token](07-page-access-token.md) | Token de Página para recuperar thread | `debug_token` ok; Iris responde após reply no celular |

## App Review (produção pública)

| # | Guia | Quando |
| - | ---- | ------ |
| 08 | [App Review](08-app-review.md) | App em Development só serve testers; para clientes externos, submeta revisão |

## Se algo der errado

→ [Troubleshooting](troubleshooting.md) — sintoma, causa provável e qual guia refazer.

## Referência técnica

→ [Referência de integração](../dev/referencia-tecnica.md) — fluxos de API para desenvolvedores.
