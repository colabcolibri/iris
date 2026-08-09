---
name: push-publication
description: Lê publications/, valida post.md e imagens, faz push para Iris API com curl (create post + upload assets + schedule). Use quando o usuário pedir enviar ou agendar publicação local.
allowed-tools: Read, Glob, Grep, Bash
---

# Push publication

> Workspace **iris-agent/** — sem Node. O agente lê `iris.credentials.json` e chama a API Iris com `curl`.

## Preconditions

- `iris.credentials.json` na raiz de `iris-agent/` (ver `references/credentials-contract.md`)
- `agentToken` = `IRIS_AGENT_TOKEN` no `iris-app/.env` do server
- Server Iris rodando (`iris-app`: `pnpm dev`)
- Pacote em `publications/{slug}/` com `status: ready` e ≥ 1 imagem

## Procedure

1. Read `references/credentials-contract.md` and `references/local-package-contract.md`
2. Load `apiUrl` and `agentToken` from `iris.credentials.json`
3. **Test:** `GET {apiUrl}/api/posts?limit=1` with `Authorization: Bearer {token}`
4. List `publications/*/post.md` or use slug given by user
5. Parse frontmatter + caption; abort if `status` ≠ `ready`
6. `POST {apiUrl}/api/posts` — JSON: `caption`, `channel`, `scheduled_at`, `source_note`
7. For each image (sorted): `POST {apiUrl}/api/posts/{id}/assets` multipart (`file`, `sort_order`)
8. If `scheduled_at` set: `PATCH {apiUrl}/api/posts/{id}` → `{"status":"scheduled","scheduled_at":"..."}`
9. Update `post.md`: set `iris_post_id`, `pushed_at` (ISO), keep `status: ready`
10. Tell user the post id and UI URL `{apiUrl}/`

## curl patterns

Create post:

```bash
curl -sf -X POST "${API_URL}/api/posts" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"caption":"...","channel":"instagram","scheduled_at":"...","source_note":"..."}'
```

Upload asset (example):

```bash
curl -sf -X POST "${API_URL}/api/posts/${POST_ID}/assets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@publications/slug/01.png" \
  -F "sort_order=1"
```

Schedule:

```bash
curl -sf -X PATCH "${API_URL}/api/posts/${POST_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"scheduled","scheduled_at":"..."}'
```

## Portability

Copy the entire **`iris-agent/`** folder. Edit `iris.credentials.json`. Run `./.agent/scripts/sync_cursor_kit.sh` if using Cursor adapters.

## References

- `references/credentials-contract.md`
- `references/local-package-contract.md`
- Product: `docs/architecture/local-publications.md` (monorepo)
