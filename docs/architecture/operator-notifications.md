# Notificações internas do operador

Camada **interna** para o harness DM avisar o operador editorial — separada do MCP externo (`EPIC-12`).

## Modelo

| Conceito | Descrição |
| -------- | --------- |
| `OperatorNotificationService` | Domain service — `notify(event)` |
| Canal | Implementa `OperatorNotificationChannel` (`email` v1.27+) |
| Settings | `operator_notification_settings.channels_json` (`email`, `ai_lock_days`) |
| Log | `operator_notifications` — auditoria de envios |
| Trava de IA | `conversations.ai_locked_until` — pausa automática após escalação |

## Evento

```json
{
  "type": "operator_attention_required",
  "urgency": "low | medium | high",
  "reason": "string (IA)",
  "customerSummary": "string (IA)",
  "inboundMessageText": "texto real da DM",
  "messageTimestamp": "ISO",
  "participantUsername": "optional",
  "conversationId": "optional"
}
```

## Email (v1.28)

- Layout Iris HTML (`build-operator-notification-email.ts`) com card estilo chat (autor, data/hora, bolha).
- `reason` e `customerSummary` vêm da IA via `notify_operator` — sem fallbacks no backend.
- Corpo plano (`text`) espelha o mesmo conteúdo para clientes sem HTML.

## Trava de IA (v1.28)

Após `escalated_operator`:

1. Envia `customerMessage` ao cliente (modo auto/draft conforme config).
2. Grava `ai_locked_until = now + ai_lock_days` (default **5**, configurável).
3. Novas mensagens inbound **não enfileiram** resposta da IA enquanto travado.
4. **Destrave lazy:** na próxima inbound, se `now >= ai_locked_until`, destrava antes de avaliar fila.
5. **Destrave manual:** `POST /api/conversations/:id/unlock-ai` + botão no inbox.

Sem worker dedicado — expiração avaliada no fluxo inbound.

## API admin

| Method | Path | Descrição |
| ------ | ---- | --------- |
| GET | `/api/settings/operator-notifications` | Canais + `ai_lock_days` |
| PUT | `/api/settings/operator-notifications` | Atualiza email e dias de trava |
| POST | `/api/settings/operator-notifications/test` | Dispara email de teste com card |
| POST | `/api/conversations/:id/unlock-ai` | Destrava IA na conversa |

## Diferença vs MCP

- **MCP:** agentes externos (Cursor, ChatGPT) — tools REST/MCP públicas.
- **Notificação interna:** runtime Iris DM — tool `notify_operator` no harness; não exposta ao MCP nesta versão.

## Canais futuros

Registry plugável — Slack, webhook, push entram como novos `OperatorNotificationChannel` sem alterar o harness.
