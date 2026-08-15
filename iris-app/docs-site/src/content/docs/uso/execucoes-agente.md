---
title: "Execuções do agente"
description: "Execuções do agente"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/agent-runs` · menu **Execuções** · **Para:** entender por que a IA respondeu (ou não respondeu) de determinada forma

## Lista de execuções

Cada vez que o agente avalia um comentário ou DM, isso gera uma "execução". A lista mostra filtros por status e por [tier](/docs/uso/glossario/#termos-técnicos), e uma tabela com quando aconteceu, o que disparou a execução, qual modelo de IA respondeu e quantos [tokens](/docs/uso/glossario/#termos-técnicos) foram usados.

![lista de runs com filtro de status](/docs/images/uso/34-execucoes-agente.png)

## Detalhe de uma execução

Clique numa linha para ver as etapas que o agente seguiu:

1. **Triagem** — decisão de responder ou não a esse comentário/mensagem.
2. **Rascunho** — o texto que a IA gerou.
3. **Verificação** — checagens finais antes de publicar ou enviar.

O detalhe também mostra qual modelo respondeu, quantos tokens consumiu, e um link **abrir thread do comentário** quando aplicável.

## Quando consultar esta tela

- Para entender por que a IA respondeu (ou não) de um jeito específico a um comentário ou mensagem.
- Depois de clicar em **Ver decisão do agente** num comentário — o link leva direto para cá.
- Para acompanhar o uso da IA (modelo e tokens) durante uma campanha, se quiser ter noção de custo.

## Próximos passos

→ [Comentários — responder](/docs/uso/comentarios-responder/) · [Fila do agente](/docs/uso/fila-agente/)
