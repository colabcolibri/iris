---
title: "Webhooks — monitoramento"
description: "Webhooks — monitoramento"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/webhooks` · **Para:** operador que quer saber se eventos Meta chegam ao Iris

## Abrir a tela

Menu **Webhooks** → lista de eventos recentes da Meta (comentários, etc.).

![tabela com colunas Recebido, Tipo, Status, Autor/resumo](/docs/images/uso/32-webhooks-lista.png)

## Filtros

- **Status** — recebido, processado, ignorado, falhou, assinatura inválida
- **Tipo** — todos / comentários / só assinatura inválida
- **Atualizar**
- **Exportar últimos** / **Exportar JSON** — para enviar ao time técnico

## Status — o que significam

| Status | Interpretação operacional |
| ------ | ------------------------- |
| **processado** | Iris tratou o evento |
| **ignorado** | Evento recebido mas descartado (ex.: fora da janela) |
| **falhou** | Erro no pipeline — veja detalhe |
| **[assinatura inválida](/docs/uso/glossario/#termos-técnicos)** | Problema de configuração no servidor (escale técnico) |

## Detalhe do evento

Clique na linha → painel com **Post**, **Comentário**, **Autor**, **[Payload](/docs/uso/glossario/#termos-técnicos)** (os dados brutos do evento, truncados na tela).

![detalhe com payload parcial](/docs/images/uso/33-webhook-detalhe.png)

## Checklist semanal (operador)

1. Header: Instagram conectado (`@usuario`)?
2. Webhooks: eventos **processado** nos últimos 7 dias?
3. **Fila do agente** sem fila parada por horas?
4. Teste real: comentário de teste no IG → evento em ~1 min → aparece em **Comentários**?

## O que você faz vs. time técnico

**Você:**

- Reconectar Instagram (**Testar conexão** no header)
- Confirmar conta Instagram correta no teste
- Exportar JSON dos últimos eventos com horário

**Time técnico (interno):**

- URL webhook no app Meta, secrets, tokens Page, logs servidor

→ [Fila do agente](/docs/uso/fila-agente/) · [Execuções do agente](/docs/uso/execucoes-agente/)
