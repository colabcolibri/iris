# Publicações locais e push para o server

## Princípio

Iris é um **gestor de postagens genérico**. Não conhece Casper, Canva nem qualquer ferramenta de criação. O **agente local** monta o pacote; o **server** armazena mídia + metadados e publica no Instagram.

## Pasta local (`iris-app/publications/`)

Convive com o app em `iris-app/` (gitignored ou commitada conforme política da equipe):

```txt
iris-app/publications/
  2026-08-12-lancamento-produto/
    post.md
    01.png
    02.png
    03.png
```

### `post.md`

```yaml
---
title: Lançamento produto X
scheduled_at: 2026-08-12T18:00:00.000Z
channel: instagram
status: ready          # draft | ready — agente só faz push se ready
source_note: opcional  # texto livre: "export manual", "casper via API", etc.
iris_post_id:          # preenchido após push
pushed_at:             # ISO após push bem-sucedido
---

Legenda da publicação.

#hashtags
```

- **`status: draft`** — rascunho local; agente ignora no scan.
- **`status: ready`** — agente pode fazer push.
- **`source_note`** — rastreabilidade humana; Iris persiste como campo opcional, sem semântica especial.

### Imagens

- Arquivos na mesma pasta: `*.png`, `*.jpg`, `*.webp`
- Ordem do carrossel: prefixo numérico (`01`, `02`, …) ou ordem lexicográfica
- Agente valida presença de ao menos uma imagem antes do push

## Fluxo push (agente local → Iris server)

1. Ler `post.md` + listar imagens
2. `POST /api/posts` — `{ caption, scheduled_at, channel, source_note? }`
3. Resposta: `{ id: post_id }`
4. Para cada imagem: `POST /api/posts/:id/assets` (multipart, `sort_order`) — server otimiza para JPEG
5. `PATCH /api/posts/:id` — `{ status: "scheduled" }` (se `scheduled_at` definido)
6. Atualizar `post.md` local: `iris_post_id`, `pushed_at`, `status: draft` → manter ou `pushed`

## Onde ficam os bytes no server

```txt
data/
  iris.db
  media/
    {post_id}/
      01.png
      02.png
```

- Tabela `post_assets`: `storage_path`, `sort_order`, `mime`, `size_bytes`
- Worker de publicação lê de `data/media/` — não depende de URLs externas
- UI preview: `GET /api/posts/:id/assets/:filename`

## Ferramentas externas (Casper, etc.)

Fora do Iris. Se o agente precisar de material do Casper:

1. Agente chama API do Casper (ou export manual)
2. Salva imagens + legenda em `publications/{slug}/`
3. Executa fluxo push acima

Iris nunca importa código nem schema do Casper.

## Skill do agente

`.agent/skills/push-publication/` — procedimento para scan, validação, upload e atualização de `post.md`.
