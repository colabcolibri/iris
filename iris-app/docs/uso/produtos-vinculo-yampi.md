# Produtos — vínculo Yampi

**Rota:** `/admin/products` → detalhe do produto → seção **Loja virtual** · **Para:** conectar um produto do Iris ao produto correspondente na sua loja Yampi

## Pré-requisitos

Uma loja Yampi já precisa estar conectada em **Lojas**. Se ainda não conectou nenhuma, veja [Lojas — conectar](./lojas-conectar.md) primeiro.

## O que este vínculo faz

Depois de vinculado, o Iris passa a buscar dados do produto (preço, descrição, estoque etc.) direto da Yampi, para que o agente de DM tenha informação atualizada ao conversar com clientes sobre esse produto — sem você precisar digitar os dados duas vezes.

## Como vincular um produto

1. Abra o produto em **Produtos** e vá até a seção **Loja virtual**.
2. Em **Conexão**, selecione a loja Yampi já conectada em **Lojas**.
3. Preencha **ID do produto na Yampi** — o número que identifica esse produto no painel da Yampi.
4. Clique **Vincular** — o Iris busca os dados desse produto na Yampi.
5. Em **Políticas de campo**, decida, campo a campo (Nome, Preço, URL…), de onde o valor deve vir: **Padrão da loja** (usa o que está configurado para todos os produtos) ou um override específico para este produto — **Iris** (valor digitado manualmente), **Loja** (sempre o valor da Yampi) ou **Desativado** (o agente nunca vê esse campo).
6. Confira em **Preview resolvido** os valores finais que o agente vai efetivamente usar — é o resultado depois de aplicar as políticas.
7. Clique **Salvar políticas de campo**.

**Como saber que deu certo:** o **Preview resolvido** mostra os dados do produto (nome, preço, etc.) preenchidos com valores reais vindos da Yampi ou do que você definiu manualmente — não mais campos vazios.

### Exemplo prático

Se você quer que o **preço** sempre reflita o que está na Yampi (para nunca ficar desatualizado), mas prefere escrever a **descrição** você mesmo: deixe **Preço** como **Loja** e **Descrição** como **Iris**.

## Políticas globais vs. por produto

A loja tem políticas globais que definem o padrão para todos os produtos vinculados a ela. Cada produto pode sobrescrever esse padrão individualmente, como no passo 5 acima. Detalhes das políticas globais em [Políticas de campo](./lojas-politicas-campo.md).

## Próximos passos

→ [Lojas — políticas de campo](./lojas-politicas-campo.md) · [Cadastro de produtos](./produtos-cadastro.md)
