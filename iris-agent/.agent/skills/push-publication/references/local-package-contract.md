# Local package contract

## Path

`publications/{slug}/` (relative to iris-agent root, or `publicationsDir` from credentials)

- `slug`: kebab-case
- `post.md` required
- Images: `*.png`, `*.jpg`, `*.jpeg`, `*.webp`

## post.md frontmatter

| Field | Required | Values |
| ----- | -------- | ------ |
| `title` | yes | Internal label |
| `scheduled_at` | no | ISO 8601 UTC |
| `channel` | yes | `instagram` |
| `status` | yes | `draft` \| `ready` — push only if `ready` |
| `source_note` | no | Free text |
| `iris_post_id` | no | Filled after push |
| `pushed_at` | no | ISO after push |

Body markdown = caption for API.

## Validation before push

- `status === ready`
- ≥ 1 image
- Non-empty caption
- `scheduled_at` in the future if scheduling

## Image order

Numeric prefix (`01.png`, `02.png`) or lexicographic sort.
