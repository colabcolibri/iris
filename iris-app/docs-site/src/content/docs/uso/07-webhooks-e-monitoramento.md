---
title: "07 — Webhooks e saúde do sistema"
description: "Webhooks e saúde do sistema"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Tempo:** ~5 min · **Para:** operador que quer saber se “está tudo ok”

## O que você vai fazer

Usar a tela de **Webhooks** no admin para ver se o Instagram está mandando eventos ao Iris — sem precisar entender código.

## Passo 1 — Abrir Webhooks

Menu lateral → **Webhooks**.

Você vê uma lista de eventos recentes (comentários, mensagens, etc.) que a Meta enviou ao Iris.

## Passo 2 — O que é “normal”

| Sinal bom | Significado |
| --------- | ----------- |
| Eventos **recentes** (últimos minutos/horas) | Meta está falando com o Iris |
| Status **processado** ou similar | Iris recebeu e tratou |
| Novo comentário no Instagram → evento aqui em ~1 min | Pipeline saudável |

## Passo 3 — Sinais de problema

| Sinal ruim | O que pode ser |
| ---------- | -------------- |
| **Nenhum evento** há dias | Webhook não configurado ou URL errada — [configuração](../configuracao/04-webhooks/) |
| Muitos **erros** seguidos | Token expirado ou permissão revogada — reconecte Instagram |
| Eventos chegam mas comentários não aparecem | Fila travada ou servidor reiniciando — veja **Fila** |

## Passo 4 — O que você pode fazer vs. pedir ajuda

**Você (operador):**

- Reconectar Instagram no header
- Confirmar que comentou/testou DM na conta certa
- Anotar horário do último evento bom

**Quem instalou o servidor:**

- Corrigir URL do webhook no painel Meta
- Renovar tokens e variáveis de ambiente
- Ver logs do servidor

## Passo 5 — Checklist rápido semanal

1. Instagram ainda conectado no header?
2. Webhooks com eventos nos últimos 7 dias?
3. Fila sem centenas de itens parados?
4. Pelo menos um post agendado/publicou na semana?

## Próximo passo

→ [Problemas no uso](./troubleshooting/) ou volte ao [índice de uso](./)
