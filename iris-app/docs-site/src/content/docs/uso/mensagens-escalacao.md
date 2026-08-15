---
title: "Mensagens — escalação e IA pausada"
description: "Mensagens — escalação e IA pausada"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Para:** entender o que acontece quando o agente de DM decide que uma conversa precisa de um humano

## O que é escalação

O agente de Mensagens é treinado para reconhecer quando não deve continuar sozinho — por exemplo, reclamações, pedidos fora do que ele sabe responder, ou qualquer situação sensível. Quando isso acontece:

1. O cliente é avisado de que o caso será verificado por alguém da equipe.
2. Se **Alertas do operador** estiver ligado, um email é enviado para o **Email do operador** configurado.
3. A conversa passa a exibir o badge **IA pausada** — o agente para de responder automaticamente até alguém destravar.

![badge **IA pausada** + botão **Retomar IA**](/docs/images/uso/23-dm-ia-pausada.png)

## Como destravar uma conversa pausada

- Clique **Retomar IA** dentro da conversa, ou
- Aguarde: se **Retomar IA automaticamente após (dias)** estiver configurado em **Configurações → Alertas do operador**, o Iris destrava sozinho depois de N dias.

**Como saber que deu certo:** o badge **IA pausada** desaparece e o agente volta a responder novas mensagens naquela conversa.

## Configurar os alertas de escalação

Quem recebe o email, se recebe, e depois de quantos dias a IA retoma sozinha — tudo isso fica em [Alertas do operador](./alertas-operador.md).

## Próximos passos

→ [Alertas do operador](./alertas-operador.md) · [Mensagens — responder](./mensagens-responder.md)
