# Agente de DMs

**Rota:** `/admin/settings` · seção **Agente de DMs** (`#message-agent`)

Card **Agente de mensagens (DM)** — mesma lógica de modos que comentários:

| Modo global | Efeito |
| ----------- | ------ |
| **Desligado** | Só resposta manual |
| **Automático** | IA envia após debounce |
| **Com aprovação** | Rascunho antes de enviar |

**Janela de debounce** — aguarda após a última mensagem do cliente na mesma conversa.

**Tempo antes de responder** — imediato ou fila com delay.

**Intervalo do worker** — link visual para card de comentários (valor compartilhado).

→ [Mensagens — visão geral](./mensagens-visao-geral.md) · [Escalação](./mensagens-escalacao.md)
