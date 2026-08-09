# Local package contract

## Path

`iris-app/publications/{slug}/`

- `slug`: kebab-case, único por rascunho
- `post.md` obrigatório
- Imagens: `*.png`, `*.jpg`, `*.jpeg`, `*.webp` na mesma pasta

## post.md frontmatter

| Field | Required | Values |
| ----- | -------- | ------ |
| `title` | yes | Identificação interna |
| `scheduled_at` | no | ISO 8601 UTC |
| `channel` | yes | `instagram` (v1) |
| `status` | yes | `draft` \| `ready` |
| `source_note` | no | Texto livre |
| `iris_post_id` | no | Preenchido após push |
| `pushed_at` | no | ISO após push |

Body markdown = legenda (`caption` na API).

## Image order

1. Prefixo numérico no filename (`01.png`, `02.png`)
2. Fallback: ordem lexicográfica

## API sequence

```txt
POST /api/posts
POST /api/posts/:id/assets  (× N)
PATCH /api/posts/:id        (status scheduled, se aplicável)
```

Script: `iris-app/scripts/push-publication.ts` (`IRIS_API_URL`, `IRIS_AGENT_TOKEN`).

## Validation before push

- `status === ready`
- ≥ 1 image file
- `caption` non-empty (body trimmed)
- `scheduled_at` in future if scheduling
