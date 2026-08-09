# Meta integration

## Prerequisites

- Instagram Business ou Creator account
- Facebook Page linked to IG account
- Meta Developers app with permissions:
  - `instagram_basic`
  - `instagram_content_publish`
  - `instagram_manage_comments`
  - `pages_read_engagement`
- Long-lived Page access token stored server-side (`meta_tokens` table)

## Publishing flow (carousel)

1. For each image URL in `post_assets`: `POST /{ig-user-id}/media` with `image_url`, `is_carousel_item=true`
2. Create carousel container with `media_type=CAROUSEL`, `children` = container ids
3. `POST /{ig-user-id}/media_publish` with container id
4. Optional: `scheduled_publish_time` (Unix) when scheduling via API

## Comments

- Subscribe webhook field: `comments`
- On event: extract `media_id`, `comment_id`, `text`, `username`
- Match `posts.ig_media_id` → link `comments.post_id`
- Reply: `POST /{comment-id}/replies?message=...`

## Webhook verification

- `GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
- `POST`: validate `X-Hub-Signature-256` with app secret

## Error handling

| Error | Action |
| ----- | ------ |
| Token expired | Alert operador; posts queue paused |
| Rate limit | Exponential backoff in worker |
| Invalid media URL | Post `failed` before publish attempt |
