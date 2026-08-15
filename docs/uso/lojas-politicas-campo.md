# Lojas — políticas de campo

**Rota:** `/admin/stores` · detalhe da loja · **Políticas globais de campo**

## Matriz de origem

Para cada campo (Nome, Preço, URL, imagem, etc.):

| Origem | Significado |
| ------ | ----------- |
| **Iris** | Valor editado manualmente no produto |
| **Loja** | Valor vindo da Yampi após sync |
| **Desativado** | Campo omitido do contexto do agente |

## Preview resolvido

No detalhe do produto, **Preview resolvido** mostra o que o agente de DM verá após aplicar políticas globais + overrides do produto.

![tabela de políticas globais na loja com colunas campo/origem](/docs/images/uso/27-lojas-sync.png)

## Quando ajustar

- Preço sempre da loja, descrição sempre do Iris
- Ocultar URL de checkout do agente
- Após mudar políticas globais, revise produtos vinculados

→ [Produtos — vínculo Yampi](./produtos-vinculo-yampi.md)
