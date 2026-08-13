# Fluxo de resposta a DMs Instagram

Segundo harness de mensagens (v1.18), separado do fluxo de comentários.

```mermaid
sequenceDiagram
  participant Meta as Meta webhook
  participant API as iris-server
  participant DB as SQLite
  participant Worker as message-responder
  participant Harness as message-harness
  participant Graph as Graph API send

  Meta->>API: messaging webhook (inbound)
  API->>DB: upsert conversation + message
  API->>Worker: enqueue message reply (se auto/draft)
  Worker->>Harness: triage → draft → verify
  Harness->>DB: agent_run + steps (message_id)
  alt modo draft
    Worker->>DB: upsert draft
  else modo auto + janela 24h
    Worker->>Graph: sendText
    Worker->>DB: mark replied
  end
  API-->>Admin: SSE messages-changed
```

## Pontos de entrada

| Entrada | Descrição |
| ------- | --------- |
| Webhook `messaging` | Ingestão inbound; enfileira worker conforme settings |
| `POST /api/messages/:id/ai-reply` | Geração manual (auto ou draft) |
| `POST /api/messages/:id/approve-reply` | Aprova rascunho e envia |
| `POST /api/messages/:id/reply` | Resposta manual do operador |
| `POST /api/agent/simulate` (`channel=dm`) | Sandbox sem Meta |

## Regras Meta

- Resposta só dentro da **janela de 24h** após a última mensagem inbound (`can_reply`).
- Conta precisa de **Page vinculada** (`messaging_supported` em `/api/meta/status`).
