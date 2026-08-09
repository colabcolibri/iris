---
name: push-publication
description: Lê pacotes em iris-app/publications/, valida post.md e imagens, faz push para Iris API (create post + upload assets + schedule). Use quando o usuário pedir para enviar ou agendar uma publicação local.
allowed-tools: Read, Glob, Grep, Bash
---

# Push publication

> Envia um pacote local `iris-app/publications/{slug}/` para o Iris server. Iris não lê pastas locais — este skill orquestra a API.

## Preconditions

- `IRIS_API_URL` e `IRIS_AGENT_TOKEN` no ambiente (ou `.env` local)
- Pasta com `post.md` (`status: ready`) e ao menos uma imagem
- Server Iris acessível

## Procedure

1. Read `references/local-package-contract.md`
2. List `iris-app/publications/*/post.md` ou usar slug informado pelo usuário
3. Parse frontmatter: `caption` (body), `scheduled_at`, `channel`, `status`
4. Se `status` ≠ `ready`, parar e informar usuário
5. `POST {IRIS_API_URL}/api/posts` com Bearer token — body conforme `docs/07_api_contracts.md`
6. Para cada imagem (ordem numérica): `POST /api/posts/{id}/assets` multipart
7. Se `scheduled_at` definido: `PATCH /api/posts/{id}` → `status: scheduled`
8. Atualizar `post.md`: `iris_post_id`, `pushed_at` (ISO)
9. Reportar URL do post na UI admin se aplicável

## CLI

```bash
cd iris-app
IRIS_API_URL=http://127.0.0.1:8792 IRIS_AGENT_TOKEN=... \
  node --experimental-strip-types scripts/push-publication.ts publications/{slug}
```

## External tools (optional)

Se imagens não estão na pasta, o agente obtém de qualquer fonte e salva na pasta antes do push. **Não é necessário otimizar localmente** — o server redimensiona e comprime no upload (ver `docs/architecture/image-optimization.md`). Pré-otimizar só economiza banda no upload.

## References

- `references/local-package-contract.md`
- Product: `docs/architecture/local-publications.md`
