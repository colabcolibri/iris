---
title: "Glossário"
description: "Glossário"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

Termos técnicos que aparecem no admin e o que significam em linguagem de operador. Cada artigo que usa um destes termos deve linkar para cá em vez de redefinir.

## Termos técnicos

| Termo | O que é, em linguagem simples |
| ----- | ------------------------------ |
| **Debounce / janela de debounce** | Tempo de espera depois do último comentário ou mensagem de alguém antes do agente responder. Existe para o agente não responder no meio de uma sequência de mensagens — ele espera a pessoa "terminar de falar". |
| **Worker** | O processo em segundo plano que efetivamente processa a fila e envia as respostas do agente. Você não controla o worker diretamente — só o intervalo dele (com que frequência ele roda) nas Configurações. |
| **Fila / item na fila** | Comentários e DMs aguardando o agente processar. Veja [Fila do agente](./fila-agente.md). |
| **Webhook** | O aviso automático que a Meta (Instagram/Facebook) manda para o Iris toda vez que algo acontece (um comentário novo, uma DM nova). É assim que o Iris "sabe" que algo novo chegou sem precisar ficar checando o tempo todo. Veja [Webhooks](./webhooks.md). |
| **Payload** | O conteúdo bruto de um evento vindo da Meta — os dados técnicos do que aconteceu. Só é relevante se o time técnico pedir para você exportar isso em um chamado. |
| **Assinatura inválida** (nos webhooks) | Falha na verificação de segurança do evento vindo da Meta. Não é algo que o operador resolve — é sempre um problema de configuração no servidor; acione o time técnico. |
| **Token / modelo de IA** | "Token" é a unidade que mede quanto texto a IA processou (aproximadamente pedaços de palavra); "modelo" é qual versão de IA respondeu. Aparecem em [Execuções do agente](./execucoes-agente.md) para ajudar a entender custo e comportamento — não é algo que você precisa configurar no dia a dia. |
| **MCP (Model Context Protocol)** | Um protocolo que permite ligar o Iris a ferramentas externas de IA (como Cursor, ChatGPT ou Claude) para que elas consultem dados do Iris. É um recurso avançado — se você não usa nenhuma dessas ferramentas externas, pode ignorar essa seção nas Configurações. |
| **Triagem** | A etapa em que o agente decide se um comentário ou mensagem merece resposta (e como). Aparece no detalhe de uma execução em [Execuções do agente](./execucoes-agente.md). |
| **Tier** | O nível/categoria de prioridade ou complexidade atribuído a uma execução do agente — usado para filtrar a lista em [Execuções do agente](./execucoes-agente.md). |
| **SOUL** | O bloco de texto na Persona que define a voz e o tom do agente (como ele "fala"). Veja [Persona da marca](./persona-marca.md). |

## Nomes canônicos

Quando o produto tem mais de um nome para a mesma coisa, use sempre o nome à esquerda. Cite o outro nome só na primeira menção do artigo, entre parênteses, se ajudar a situar quem já conhece a tela pelo outro nome.

| Nome canônico | Não usar (ou usar só entre parênteses, 1x) |
| -------------- | -------------------------------------------- |
| **Kanban** | "Pipeline editorial" (nome que aparece no título da própria página — cite 1x, depois use Kanban) |
| **Mensagens** | "DMs" (usar só quando for preciso diferenciar de comentários; o menu chama "Mensagens") |
| **Rascunho gerado pela IA** | "Resposta IA" / "Rascunho IA" — variações soltas do mesmo conceito |
| **Modo global** | "Modo padrão" — sempre "modo global" para o valor herdado das Configurações |

Se você encontrar um termo usado de forma inconsistente que não está nesta tabela, adicione a entrada aqui antes de seguir — é assim que o glossário se mantém útil.
