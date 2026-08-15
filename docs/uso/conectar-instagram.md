# Conectar Instagram

**Para:** operador da conta da marca · **Onde:** header do admin

## Quando conectar

Você precisa conectar quando vê:

- Botão **Conectar** ou **Conectar Instagram** no header
- Aviso *"Conecte sua conta do Instagram para agendar e publicar posts"*
- Aviso *"Sua sessão com o Instagram expirou. Conecte de novo para agendar publicações."*

![header desconectado com botão **Conectar Instagram**](/docs/images/uso/06-header-conectar.png)

## Passo a passo — OAuth

1. Clique **Conectar** (ou **Reconectar Instagram**).
2. Na Meta, faça login na conta Instagram **profissional** (Business ou Creator) da marca.
3. Aceite **todas** as permissões solicitadas.
4. Volte ao Iris — o chip deve mostrar **`@seu_usuario`**.

![chip verde `@usuario` com dropdown aberto mostrando **Testar conexão**, **Trocar conta**, **Desconectar**](/docs/images/uso/05-header-instagram.png)

## Menu `@usuario`

| Ação | Quando usar |
| ---- | ----------- |
| **Testar conexão** | Verificar se o token ainda publica e lê comentários |
| **Trocar conta** | Mudar para outro @ ou renovar permissões após mudança no app Meta |
| **Desconectar** | Pausar publicação e sync até reconectar |

**Trocar conta** redireciona ao login da Meta. A conta atual permanece até a nova conexão concluir.

## O que o operador faz vs. o time técnico

| Você (operador) | Time técnico (interno) |
| --------------- | ---------------------- |
| Conectar, testar, trocar conta | App Meta, webhooks, variáveis de servidor |
| Confirmar @ correto no teste | Logs de OAuth e tokens Page (DMs) |

Se **Testar conexão** falha repetidamente, anote o horário e o @ tentado e acione quem mantém o Iris.

## Próximo passo

→ [Calendário — visão geral](./calendario-visao-geral.md) · [Comentários — visão geral](./comentarios-visao-geral.md)
