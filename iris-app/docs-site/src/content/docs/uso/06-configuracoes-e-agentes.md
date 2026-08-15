---
title: "06 — Configurações e agentes"
description: "Configurações e agentes"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Tempo:** ~20 min na primeira vez · **Para:** operador ou gestor da conta

## O que você vai fazer

Ajustar fuso horário, notificações, modelos de IA e comportamento dos agentes de comentários e DMs.

## Passo 1 — Configurações gerais

Menu lateral → **Configurações**.

| Opção | Para quê |
| ----- | -------- |
| **Fuso horário** | Horários de agendamento batem com sua cidade |
| **Idioma do admin** | Interface em português ou inglês |
| **Notificações por email** | Avisos quando o agente escala para humano |

Salve após cada alteração.

## Passo 2 — Agente de comentários

Em **Configurações → Agente de comentários** (ou seção equivalente):

- **Modo global:** automático, supervisionado ou silêncio
- **Ativar/desativar** respostas automáticas
- **Delay** antes de responder (parecer mais natural)

Um post específico pode ter regras próprias no editor do post.

## Passo 3 — Agente de DMs

Em **Configurações → Agente de DMs**:

- Mesmos modos (automático / supervisionado / silêncio)
- Instruções extras só para mensagens privadas
- Trava de IA após escalação humana

## Passo 4 — Persona (tom de voz)

Menu **Persona** — separado das configurações técnicas:

1. Descreva **quem é a marca** (2–3 frases).
2. Defina **tom** (formal, amigável, técnico).
3. Liste **o que nunca dizer** (promessas, concorrentes, etc.).
4. Salve.

Isso alimenta o agente em comentários e DMs. Vale revisar depois de campanhas grandes.

## Passo 5 — Modelo de IA (LLM)

Se o seu Iris expõe **Configurações → Modelo / LLM**:

- Escolha o provedor e modelo que o administrador liberou.
- **Chave de API** normalmente é configurada no servidor — você só escolhe o modelo, se permitido.

Sem modelo configurado, agentes não geram texto.

## Passo 6 — Simulador (testar antes de publicar)

Menu **Simulador** (se disponível):

1. Crie um cenário de teste (comentário ou DM fictício).
2. Rode a simulação.
3. Veja a resposta que o agente **teria** enviado.

Útil para validar persona antes de ligar o automático.

## Passo 7 — Execuções e fila (monitoramento leve)

| Tela | O que mostra |
| ---- | ------------ |
| **Execuções do agente** | Histórico de respostas geradas |
| **Fila** | Trabalhos pendentes (publicação, respostas) |

Use para ver se algo está travado — muitos itens parados por horas podem indicar servidor ou Meta fora.

## Problemas comuns

| Sintoma | O que fazer |
| ------- | ----------- |
| Horário do post errado | Ajuste **fuso horário** e reagende |
| Agente muito robótico | Refine **Persona**; use modo supervisionado |
| Não recebo email de escalação | Confira email em notificações e caixa de spam |

## Próximo passo

→ [07 — Webhooks e saúde do sistema](./07-webhooks-e-monitoramento/)
