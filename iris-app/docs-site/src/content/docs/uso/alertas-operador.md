---
title: "Alertas do operador"
description: "Alertas do operador"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/settings` · seção **Alertas do operador** (`#operator-notifications`) · **Para:** quem precisa saber quando o agente escala uma conversa para humano

## O que esta seção controla

Quando o [agente de Mensagens escala um caso](./mensagens-escalacao.md) — ou seja, decide que precisa de um humano — esta seção define quem é avisado e por quanto tempo a conversa fica travada esperando ação humana.

| Controle | Função |
| -------- | ------ |
| **Enviar alertas por email** | Liga/desliga o envio de email quando uma conversa é escalada |
| **Email do operador** | Endereço que recebe os alertas |
| **Retomar IA automaticamente após (dias)** | Depois de N dias sem ninguém destravar manualmente, o Iris libera a IA para voltar a responder sozinha nessa conversa |

## Como configurar

1. Ligue **Enviar alertas por email** se quiser ser avisado por email a cada escalação.
2. Preencha **Email do operador** com o endereço que deve receber os alertas.
3. Defina **Retomar IA automaticamente após (dias)** — deixe vazio se preferir que toda conversa escalada só seja destravada manualmente.
4. Clique **Salvar**.
5. Use **Enviar teste** para confirmar que o email realmente chega antes de contar com o alerta em produção.

**Como saber que deu certo:** o email de teste chega na caixa configurada em poucos minutos. Se não chegar, confira a pasta de spam antes de acionar o time técnico.

## Próximos passos

→ [Mensagens — escalação e IA pausada](./mensagens-escalacao.md)
