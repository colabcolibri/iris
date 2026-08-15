---
title: "Configurações — visão geral"
description: "Configurações — visão geral"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/settings` · título **Configurações**

Layout split: navegação lateral de seções + conteúdo.

| Seção | Âncora | Para quê |
| ----- | ------ | -------- |
| **Fuso horário editorial** | `#timezone` | Horários do calendário |
| **Auto-monitoramento** | `#auto-monitor` | Poll de posts novos no IG |
| **Insights em lote** | `#insights` | Atualizar métricas de posts |
| **Agente de comentários** | `#comment-agent` | Modo global, debounce, janela |
| **Agente de DMs** | `#message-agent` | Modo global DM |
| **Alertas do operador** | `#operator-notifications` | Email escalação + trava IA |
| **Conexão MCP** | `#mcp` | Liga ferramentas externas de IA (Cursor, ChatGPT, Claude) ao Iris — [avançado, veja glossário](/docs/uso/glossario/#termos-técnicos); ignore se você não usa essas ferramentas |
| **Permissões MCP** | `#mcp-permissions` | O que essas ferramentas externas podem acessar no Iris, quando conectadas |
| **Provedor de IA** | `#llm` | Chave de API e modelo de IA usados pelo agente |

![layout split — lista de seções à esquerda e conteúdo da seção à direita](/docs/images/uso/28-configuracoes-nav.png)

> **Persona** não fica aqui — menu separado **Persona** (`/admin/persona`).

## Guias por seção

→ [Fuso e monitoramento](/docs/uso/fuso-e-monitoramento/) · [Agente de comentários](/docs/uso/agente-comentarios/) · [Agente de DMs](/docs/uso/agente-dms/) · [Alertas](/docs/uso/alertas-operador/) · [Persona](/docs/uso/persona-marca/)
