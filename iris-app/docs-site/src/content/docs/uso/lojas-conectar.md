---
title: "Lojas — conectar e sincronizar"
description: "Lojas — conectar e sincronizar"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Rota:** `/admin/stores` · título **Lojas conectadas**

## Nova conexão Yampi

1. **Conectar loja** / **Nova conexão**
2. Sheet **Conectar loja Yampi**:
   - **Nome da conexão**
   - **User Token** + **User Secret Key**
   - **Buscar lojas da conta**
   - **Alias Yampi** (dropdown)
3. **Conectar loja**

![sheet **Conectar loja Yampi** com campos de token](/docs/images/uso/26-lojas-conectar.png)

## Manutenção

No detalhe da loja:

- **Testar conexão**
- **Sincronizar catálogo** — importa/atualiza produtos (`Importar produtos novos da loja` opcional)
- **Políticas globais de campo** — padrão para produtos vinculados
- **Remover conexão**

![detalhe loja com **Testar conexão** e **Sincronizar catálogo**](/docs/images/uso/27-lojas-sync.png)

Toast de sync: *"{imported} importados, {updated} atualizados…"*

→ [Políticas de campo](/docs/uso/lojas-politicas-campo/)
