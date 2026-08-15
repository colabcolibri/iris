# Execuções do agente

**Rota:** `/admin/agent-runs` · menu **Execuções**

## Lista

Filtros por status e tier. Tabela com colunas típicas: When, Trigger, Model, Tokens.

![lista de runs com filtro de status](/docs/images/uso/34-execucoes-agente.png)

## Detalhe de uma execução

Clique na linha para ver estágios:

1. **Triagem** — decisão de responder ou não
2. **Rascunho** — texto gerado
3. **Verificação** — checagens finais

Inclui modelo usado, tokens e link **abrir thread do comentário** (quando aplicável).

## Quando consultar

- Entender por que a IA respondeu (ou não) de determinada forma
- Depurar após **Ver decisão do agente** em um comentário
- Auditar custo/tokens em período de campanha

→ [Comentários — responder](./comentarios-responder.md) · [Fila do agente](./fila-agente.md)
