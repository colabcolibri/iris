# Lista de imagens do guia de uso

Checklist de capturas de tela para o guia público. Salve em `iris-app/docs-site/public/images/uso/` (ou pasta equivalente) com os nomes abaixo.

| # | Arquivo | Página | O que capturar |
| - | ------- | ------ | -------------- |
| 01 | `01-login-email.png` | [primeiro-acesso](./primeiro-acesso.md) | Tela `/admin/login` — campo **Email**, botão **Continuar** |
| 02 | `02-login-codigo.png` | [primeiro-acesso](./primeiro-acesso.md) | Passo código 6 dígitos, **Entrar**, **Trocar email** |
| 03 | `03-calendario-mes.png` | [calendario-visao-geral](./calendario-visao-geral.md) | Calendário editorial mês atual com posts |
| 04 | `04-sidebar-completa.png` | [navegacao-no-admin](./navegacao-no-admin.md) | Sidebar expandida com todos os itens |
| 05 | `05-header-instagram.png` | [conectar-instagram](./conectar-instagram.md) | Chip verde `@usuario` + dropdown aberto |
| 06 | `06-header-conectar.png` | [conectar-instagram](./conectar-instagram.md) | Estado desconectado — **Conectar Instagram** |
| 07 | `07-nova-postagem-dialog.png` | [criar-postagem](./criar-postagem.md) | Dialog **Nova postagem**, abas Legenda/Mídias |
| 08 | `08-midia-carrossel.png` | [criar-postagem](./criar-postagem.md) | Aba **Mídias** com 2+ slides e barra de ordem |
| 09 | `09-agendar-footer.png` | [agendar-e-publicar](./agendar-e-publicar.md) | Rodapé: **Salvar rascunho**, **Agendar publicação** |
| 10 | `10-status-falhou.png` | [editar-e-status](./editar-e-status.md) | Post status **Falhou** com causa visível |
| 11 | `11-kanban-colunas.png` | [kanban-pipeline](./kanban-pipeline.md) | Pipeline **Rascunho → Agendado → Publicado → Falhou** |
| 12 | `12-kanban-filtro-periodo.png` | [kanban-pipeline](./kanban-pipeline.md) | Menu **Período** (Hoje → +15 dias) |
| 13 | `13-lista-editorial.png` | [lista-editorial](./lista-editorial.md) | Visão Lista com contagem do mês |
| 14 | `14-post-resposta-ia.png` | [post-campanha-agente](./post-campanha-agente.md) | Seção **Resposta IA**: modo, dias ativos, DM após comentário |
| 15 | `15-comentarios-publicacoes.png` | [comentarios-visao-geral](./comentarios-visao-geral.md) | Hub — aba **Publicações**, busca, **Importar** |
| 16 | `16-importar-meta.png` | [comentarios-importar](./comentarios-importar.md) | Modal **Importar da Meta** com checkboxes |
| 17 | `17-comentario-thread-aprovacao.png` | [comentarios-aprovacao](./comentarios-aprovacao.md) | Thread com rascunho IA + **Aprovar e publicar** |
| 18 | `18-atividade-aprovacao.png` | [comentarios-aprovacao](./comentarios-aprovacao.md) | Aba **Atividade** → sub-aba **Aprovação** |
| 19 | `19-post-sincronizar.png` | [comentarios-sincronizar](./comentarios-sincronizar.md) | Botões **Sincronizar** e **Vincular respostas** |
| 20 | `20-mensagens-inbox.png` | [mensagens-visao-geral](./mensagens-visao-geral.md) | Lista conversas + painel vazio/selecionado |
| 21 | `21-dm-composer.png` | [mensagens-responder](./mensagens-responder.md) | Composer **Escreva uma mensagem…**, badge janela |
| 22 | `22-dm-rascunho-ia.png` | [mensagens-aprovacao](./mensagens-aprovacao.md) | **Rascunho IA** + ações Salvar/Aprovar |
| 23 | `23-dm-ia-pausada.png` | [mensagens-escalacao](./mensagens-escalacao.md) | Badge **IA pausada** + **Retomar IA** |
| 24 | `24-produtos-lista.png` | [produtos-cadastro](./produtos-cadastro.md) | Split lista/detalhe, botão **Novo** |
| 25 | `25-produto-loja-yampi.png` | [produtos-vinculo-yampi](./produtos-vinculo-yampi.md) | Seção **Loja virtual**, ID Yampi, políticas |
| 26 | `26-lojas-conectar.png` | [lojas-conectar](./lojas-conectar.md) | Sheet **Conectar loja Yampi** |
| 27 | `27-lojas-sync.png` | [lojas-conectar](./lojas-conectar.md) | Detalhe loja — **Sincronizar catálogo**, **Testar conexão** |
| 28 | `28-configuracoes-nav.png` | [configuracoes-visao-geral](./configuracoes-visao-geral.md) | Split layout com lista de seções à esquerda |
| 29 | `29-agente-comentarios-card.png` | [agente-comentarios](./agente-comentarios.md) | Card **Agente de comentários** — modo global |
| 30 | `30-persona-identidade.png` | [persona-marca](./persona-marca.md) | Seção **Identidade da marca** |
| 31 | `31-persona-conteudo-dm.png` | [persona-marca](./persona-marca.md) | Seção **Conteúdo (DM)** |
| 32 | `32-webhooks-lista.png` | [webhooks](./webhooks.md) | Tabela eventos + filtros Status/Tipo |
| 33 | `33-webhook-detalhe.png` | [webhooks](./webhooks.md) | Painel detalhe com Payload |
| 34 | `34-execucoes-agente.png` | [execucoes-agente](./execucoes-agente.md) | Lista runs + filtro |
| 35 | `35-fila-agente.png` | [fila-agente](./fila-agente.md) | Tabela debounce/due |
| 36 | `36-simulador-comentarios.png` | [simulador-comentarios](./simulador-comentarios.md) | Palco simulador + resultado |
| 37 | `37-badge-agente-header.png` | [navegacao-no-admin](./navegacao-no-admin.md) | Badge **Agente: Automático** clicável |

## Convenção nos textos

Nos `.md` do guia, placeholders aparecem assim:

```markdown
[IMAGEM: descrição do que deve aparecer na captura — arquivo sugerido `NN-nome.png`]
```

Quando a imagem existir, substitua por `![descrição](/docs/images/uso/NN-nome.png)`.
