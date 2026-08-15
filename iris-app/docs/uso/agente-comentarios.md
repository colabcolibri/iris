# Agente de comentários

**Rota:** `/admin/settings` · seção **Agente de comentários** (`#comment-agent`)

Card **Agente de comentários**:

| Controle | Função |
| -------- | ------ |
| **Modo global** | **Desligado** / **Automático** / **Com aprovação** |
| **Intervalo do worker** | Ciclo da fila (compartilhado com DMs) |
| **Janela de debounce** | Espera após último comentário do mesmo autor no post |
| **Tempo antes de responder** | Imediato ou fila com delay (minutos) |
| **Janela de resposta** | Dias de histórico — comentários mais antigos ignorados |

Posts com **Seguir global** obedecem estes defaults. Override por post em [Agente no post](./post-campanha-agente.md).

→ [Comentários — aprovação](./comentarios-aprovacao.md) · [Fila do agente](./fila-agente.md)
