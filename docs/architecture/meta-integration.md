# Meta integration

## Prerequisites

- Instagram Business ou Creator account
- Meta Developers app com **Instagram API** (Instagram Login)
- **Instagram App ID** e **Instagram App Secret** (em Dashboard → Instagram → API setup with Instagram login → Business login settings) — **não** use o App ID de Configurações → Básico
- Redirect URI cadastrado em **Business login settings → OAuth redirect URIs**
- OAuth scopes:
  - `instagram_business_basic`
  - `instagram_business_content_publish`
  - `instagram_business_manage_comments`
  - `instagram_business_manage_insights` (revisão app v1.9)
  - `instagram_business_manage_messages` (revisão app v1.9)
- Após atualizar scopes em produção, o operador deve **Trocar conta** no header para obter token novo.
- Checklist completo de revisão: `docs/architecture/meta-app-review.md`
- Long-lived Instagram user access token stored server-side (`meta_tokens` table)
- **Não** exige Página do Facebook

## Publishing flow (carousel)

1. For each image URL in `post_assets`: `POST /{ig-user-id}/media` with `image_url`, `is_carousel_item=true`
2. Create carousel container with `media_type=CAROUSEL`, `children` = container ids
3. `POST /{ig-user-id}/media_publish` with container id
4. Optional: `scheduled_publish_time` (Unix) when scheduling via API

## Comments

- Subscribe webhook field: `comments`
- On event: extract `media_id`, `comment_id`, `text`, `username`, `parent_id`
- Match `posts.ig_media_id` → link `comments.post_id`
- Reply: `POST /{comment-id}/replies?message=...`
- Per-post sync: `POST /api/posts/:id/comments/sync` pulls comments for one `ig_media_id` and upserts into SQLite
- Legacy inbox sync: `GET /api/comments/inbox` — avoid for routine use; prefer per-post sync or webhook ingest

## Webhook verification

- `GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
- `POST`: validate `X-Hub-Signature-256` with app secret

## Error handling

| Error | Action |
| ----- | ------ |
| Token expired | Alert operador; posts queue paused |
| Rate limit | Exponential backoff in worker |
| Invalid media URL | Post `failed` before publish attempt |
