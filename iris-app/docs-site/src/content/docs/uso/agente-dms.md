---
title: "Agente de DMs"
description: "Agente de DMs"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/settings` · seção **Agente de DMs** (`#message-agent`) · **Para:** definir como a IA responde mensagens diretas por padrão, em todas as conversas

## O que esta seção controla

O comportamento padrão do agente ao responder DMs no Instagram. A lógica de modos é a mesma do [agente de comentários](./agente-comentarios.md), aplicada às conversas.

| Modo global | Efeito |
| ----------- | ------ |
| **Desligado** | Agente não responde nada — só resposta manual |
| **Automático** | IA envia a resposta sozinha, depois de esperar a [janela de debounce](./glossario.md#termos-técnicos) |
| **Com aprovação** | IA gera um rascunho e espera você aprovar antes de enviar |

| Controle | Função |
| -------- | ------ |
| **Janela de debounce** | Quanto tempo o agente espera depois da última mensagem do cliente na mesma conversa antes de responder |
| **Tempo antes de responder** | Responde imediatamente ou entra numa fila com atraso configurado (minutos) |
| **Intervalo do worker** | Mesmo valor do agente de comentários — compartilhado entre os dois, ajustável na seção de comentários |

## Como configurar

1. Acesse **Configurações → Agente de DMs**.
2. Escolha o **Modo global** desejado.
3. Ajuste **Janela de debounce** e **Tempo antes de responder** conforme a velocidade de resposta que você quer.
4. Salve.

**Como saber que deu certo:** conversas novas passam a seguir o modo escolhido — confira em [Fila do agente](./fila-agente.md) se as mensagens estão sendo processadas como esperado. Se uma conversa específica escalar para humano, veja [Escalação e IA pausada](./mensagens-escalacao.md).

## Próximos passos

→ [Mensagens — visão geral](./mensagens-visao-geral.md) · [Escalação e IA pausada](./mensagens-escalacao.md) · [Fila do agente](./fila-agente.md)
