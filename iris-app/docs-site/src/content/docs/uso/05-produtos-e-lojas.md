---
title: "05 — Produtos e lojas"
description: "Produtos e lojas"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Tempo:** ~10 min na primeira sincronização · **Para:** quem vende pelo Instagram

## O que você vai fazer

Conectar uma loja (ex.: Shopify) ao Iris para o **agente citar produtos** nas respostas e manter o catálogo atualizado.

## Passo 1 — Ver produtos no admin

1. Menu lateral → **Produtos**.
2. Lista de itens sincronizados: nome, preço, link, imagem.

Se estiver vazio, ainda não há loja conectada.

## Passo 2 — Conectar uma loja

1. Menu lateral → **Lojas** (ou **Conexões de loja**).
2. Clique em **Nova conexão**.
3. Escolha o tipo (ex.: Shopify).
4. Preencha URL da loja e credenciais que o Iris pedir.
5. Salve e use **Testar conexão**.

**Como saber que deu certo:** teste retorna sucesso e, após sincronizar, produtos aparecem em **Produtos**.

## Passo 3 — Sincronizar catálogo

1. Na lista de lojas, clique em **Sincronizar**.
2. Aguarde — pode levar alguns minutos em catálogos grandes.
3. Confira em **Produtos** se os itens batem com a loja.

Sincronize de novo quando mudar preços ou estoque na loja.

## Passo 4 — O que o agente pode falar sobre produtos

Em **Configurações** (ou políticas de campo do produto), você define o que o agente pode mencionar:

- Preço, link, estoque, descrição
- Campos que **não** devem ir para o cliente

O agente usa esses dados ao responder comentários ou DMs sobre compra.

## Passo 5 — Editar ou remover produto no Iris

Normalmente os produtos vêm da loja — edite na **loja de origem** e sincronize de novo.

Remover conexão de loja: em **Lojas**, exclua a conexão (produtos podem sumir do Iris conforme a regra do sistema).

## Problemas comuns

| Sintoma | O que fazer |
| ------- | ----------- |
| Sincronização falha | Credenciais ou URL errada — teste de novo |
| Agente não cita produto | Catálogo vazio ou política bloqueando o campo |
| Preço desatualizado | Rode **Sincronizar** na loja |

## Próximo passo

→ [06 — Configurações e agentes](./06-configuracoes-e-agentes/)
