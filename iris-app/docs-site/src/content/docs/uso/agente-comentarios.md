---
title: "Agente de comentários"
description: "Agente de comentários"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/settings` · seção **Agente de comentários** (`#comment-agent`) · **Para:** definir como a IA responde comentários por padrão, em todos os posts

## O que esta seção controla

O comportamento padrão do agente ao responder comentários no Instagram. Cada post pode ter esse padrão sobrescrito individualmente — veja [Agente no post](./post-campanha-agente.md).

| Controle | Função |
| -------- | ------ |
| **Modo global** | **Desligado** (agente não responde nada) / **Automático** (responde e publica sem revisão) / **Com aprovação** (gera rascunho, você aprova antes de publicar) |
| **Intervalo do worker** | Com que frequência o [worker](./glossario.md#termos-técnicos) processa a fila de comentários pendentes (esse intervalo é compartilhado com o agente de DMs) |
| **Janela de debounce** | Quanto tempo o agente espera depois do último comentário da mesma pessoa no post antes de responder — veja [glossário](./glossario.md#termos-técnicos) |
| **Tempo antes de responder** | Responde imediatamente ou entra numa fila com atraso configurado (minutos) |
| **Janela de resposta** | Quantos dias de comentários antigos o agente ainda considera — comentários mais antigos que isso são ignorados |

## Como configurar

1. Acesse **Configurações → Agente de comentários**.
2. Escolha o **Modo global** desejado.
3. Ajuste **Intervalo do worker**, **Janela de debounce**, **Tempo antes de responder** e **Janela de resposta** conforme a velocidade de resposta que você quer.
4. Salve.

**Como saber que deu certo:** posts com **Seguir global** (modo "herdar o padrão") passam a seguir o modo escolhido — confira em [Fila do agente](./fila-agente.md) se novos comentários estão sendo processados como esperado.

## Próximos passos

→ [Comentários — aprovação](./comentarios-aprovacao.md) · [Fila do agente](./fila-agente.md) · [Agente no post](./post-campanha-agente.md)
