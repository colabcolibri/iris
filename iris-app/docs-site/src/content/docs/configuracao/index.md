---
title: "Guia de configuração — Meta / Instagram"
description: "Guia de configuração — Meta / Instagram"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

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
| 01 | [Conta Instagram profissional](./01-conta-instagram/) | Converter para Business ou Creator | No app, a conta aparece como **profissional** |
| 02 | [Criar app na Meta](./02-criar-app-meta/) | App + Instagram Login + redirect | App criado, IDs copiados, redirect cadastrado |
| 03 | [Variáveis de ambiente](./03-variaveis-de-ambiente/) | Colocar secrets no servidor | `pnpm dev` / deploy sobe sem erro de Meta |
| 04 | [Webhooks](./04-webhooks/) | Meta avisa comentários em tempo real | Painel Meta mostra webhook **verificado (✓)** |
| 05 | [Conectar no admin](./05-conectar-instagram-admin/) | OAuth pelo header do Iris | Header mostra **@usuario** conectado |

## Roteiro — mensagens (DMs)

Opcional. Faça **depois** do roteiro acima.

| # | Guia | Resumo | Terminou quando… |
| - | ---- | ------ | ---------------- |
| 06 | [Receptor primário](./06-mensagens-receptor-primario/) | App como dono da conversa | DM de teste responde sem erro `thread_owner` |
| 07 | [Page Access Token](./07-page-access-token/) | Token de Página para recuperar thread | `debug_token` ok; Iris responde após reply no celular |

## App Review (produção pública)

| # | Guia | Quando |
| - | ---- | ------ |
| 08 | [App Review](./08-app-review/) | App em Development só serve testers; para clientes externos, submeta revisão |

## Se algo der errado

→ [Troubleshooting](./troubleshooting/) — sintoma, causa provável e qual guia refazer.

## Referência técnica

→ [Referência de integração](../dev/referencia-tecnica.md) — fluxos de API para desenvolvedores.
