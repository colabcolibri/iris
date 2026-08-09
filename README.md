# Iris (workspace Meridian)

Repositório **Meridian** do produto Iris — gestor de postagens para Instagram.

| Área | Caminho | Conteúdo |
| ---- | ------- | -------- |
| Meridian | `docs/`, `.meridian/` | Phase docs, backlog, decisões |
| Aplicação | `iris-app/` | Código Node (API, UI, workers) |

**Genérico** — não acoplado a Casper nem a outra ferramenta de criação. O agente local monta pacotes em `iris-app/publications/` e envia ao server.

## Fluxo resumido

```txt
iris-app/publications/{slug}/post.md + imagens  →  agente push  →  Iris server  →  Instagram
```

Ver `docs/architecture/local-publications.md`.

## Meridian

```bash
python3 .agent/scripts/validate_meridian.py .
```

## Dev (aplicação)

```bash
cd iris-app
cp .env.example .env
pnpm install
pnpm dev
# UI: http://127.0.0.1:8792/
```

## Estrutura local de publicação

```txt
iris-app/publications/
  minha-postagem/
    post.md      # frontmatter + legenda
    01.png
    02.png
```
