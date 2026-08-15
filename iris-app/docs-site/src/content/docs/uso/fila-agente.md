---
title: "Fila do agente"
description: "Fila do agente"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/agent-queue` · menu **Fila do agente**

## O que mostra

Itens aguardando processamento pelo worker de comentários e DMs:

| Fase | Significado |
| ---- | ----------- |
| **debounce** | Aguardando janela de debounce após último evento do autor |
| **pronto** | Due — será processado no próximo ciclo do worker |

Indicador de conexão: **Ao vivo** / **Reconectando…**

## Quando olhar

- Agente em **Automático** mas nada publica — fila parada?
- Debounce longo configurado — item pode ficar em **debounce** vários minutos
- Após pico de comentários — confirmar que itens saem de **pronto**

→ [Agente de comentários](./agente-comentarios.md) · [Webhooks](./webhooks.md)
