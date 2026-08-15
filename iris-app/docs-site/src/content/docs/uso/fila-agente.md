---
title: "Fila do agente"
description: "Fila do agente"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/agent-queue` · menu **Fila do agente** · **Para:** ver o que o agente ainda vai processar e diagnosticar respostas lentas

## O que mostra

Comentários e DMs aguardando o [worker](./glossario.md#termos-técnicos) processar.

| Fase | Significado |
| ---- | ----------- |
| **debounce** | Ainda aguardando a [janela de debounce](./glossario.md#termos-técnicos) — o tempo de espera depois do último comentário/mensagem daquela pessoa |
| **pronto** | Já passou o tempo de espera; será processado no próximo ciclo do worker |

Indicador de conexão no topo: **Ao vivo** (atualizando em tempo real) ou **Reconectando…**.

## Quando olhar esta tela

- Agente está em **Automático** mas nada é publicado — confira se a fila está parada.
- Configurou uma janela de debounce longa — é normal um item ficar em **debounce** por vários minutos antes de passar para **pronto**.
- Depois de um pico de comentários — confirme que os itens estão saindo de **pronto** (ou seja, sendo processados), e não acumulando.

**Como saber que está funcionando normalmente:** itens passam de **debounce** para **pronto** e depois somem da lista (foram processados) dentro do tempo configurado no [Agente de comentários](./agente-comentarios.md) ou [Agente de DMs](./agente-dms.md).

## Próximos passos

→ [Agente de comentários](./agente-comentarios.md) · [Webhooks](./webhooks.md) · [Execuções do agente](./execucoes-agente.md)
