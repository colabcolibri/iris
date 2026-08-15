# 04 — Mensagens (DMs)

**Tempo:** contínuo · **Para:** operador que atende inbox do Instagram

## O que você vai fazer

Ler e responder mensagens diretas (DMs) no Iris, com ou sem ajuda do agente.

## Antes de começar

DMs exigem configuração extra na Meta (além do login normal). Se o menu **Mensagens** estiver vazio ou der erro, quem instalou o Iris precisa seguir os passos **06** e **07** da [configuração](../configuracao/).

## Passo 1 — Abrir o inbox

1. Menu lateral → **Mensagens**.
2. À esquerda: lista de conversas. À direita: mensagens da conversa selecionada.

Conversas novas entram quando alguém manda DM na conta conectada.

## Passo 2 — Ler e responder

1. Clique em uma conversa.
2. Leia o histórico (mensagens do cliente e do Iris).
3. Digite no campo inferior e envie — como um chat.

Você pode **responder em qualquer mensagem** da thread (não só na última), quando o Iris mostrar essa opção.

## Passo 3 — Agente de DMs

Funciona como nos comentários:

| Modo | Comportamento |
| ---- | ------------- |
| **Automático** | Agente responde sozinho |
| **Supervisionado** | Você aprova antes de enviar |
| **Silêncio** | Só respostas manuais |

Configuração global: **Configurações → Agente de DMs**. Uma conversa pode ter modo próprio.

## Passo 4 — Quando o agente pede ajuda humana

Se o agente não souber responder ou detectar urgência, ele pode **escalar** para você:

- Você recebe **email** (se alertas estiverem ligados em Configurações).
- Na conversa, a **IA pode ser pausada** até você destravar — evita respostas em cima da sua.

Revise a mensagem, responda manualmente e, se quiser, reative o agente na conversa ou nas configurações.

## Passo 5 — Trava de IA após escalação

Depois de escalar, o Iris pode **bloquear o agente** naquela conversa por alguns dias (configurável). Isso evita que a IA interfira enquanto você resolve o caso.

Para voltar ao automático: destrave na própria conversa ou ajuste **Configurações → Alertas do operador / trava de IA**.

## Problemas comuns

| Sintoma | O que fazer |
| ------- | ----------- |
| DM não chega | Webhook com campo `messages` — [configuração](../configuracao/04-webhooks/) |
| Erro ao enviar | Conta precisa de [receptor primário](../configuracao/06-mensagens-receptor-primario/) |
| Respondi no celular e o Iris parou | Configurar [token de Página](../configuracao/07-page-access-token/) (quem instalou) |

## Próximo passo

→ [05 — Produtos e lojas](./05-produtos-e-lojas/)
