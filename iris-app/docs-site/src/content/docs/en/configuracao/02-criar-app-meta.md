---
title: "02 — Create Meta app"
description: "Create Meta app with Instagram API and your domain URLs"
---

**Time:** ~20 min · **Who:** deploy owner / Meta app admin

## Goal

Create the app in Meta for Developers with Instagram API and **your** domain URLs.

## Before you start

- Public Iris domain (e.g. `https://iris.example.com`) or dev tunnel (ngrok / Cloudflare).
- Redirect URI will be: `https://YOUR-DOMAIN/auth/meta/callback`

## Steps

### 1. Create the app

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**.
2. Type: suitable for **Instagram API** / business (e.g. "Other" → use case with Instagram).
3. App name: e.g. **IGIris**.
4. Create the app.

### 2. Add Instagram API

1. In the app dashboard → **Add product** (or **Instagram** menu).
2. Choose **API setup with Instagram login** (Instagram Login — **not** Facebook Login for Iris main flow).
3. Open **Business login settings**.

### 3. Copy Instagram credentials

In **Business login settings** (do not use Settings → Basic for OAuth):

| Iris variable | Where to copy |
| ------------- | ----------- |
| `META_INSTAGRAM_APP_ID` | Instagram App ID |
| `META_INSTAGRAM_APP_SECRET` | Instagram App Secret |

Also note for webhooks (HMAC):

| Iris variable | Where to copy |
| ------------- | ----------- |
| `META_APP_ID` | Settings → **Basic** → App ID |
| `META_APP_SECRET` | Settings → **Basic** → App secret |

### 4. Register redirect URI

1. In **Business login settings** → **OAuth redirect URIs**.
2. Add:
   - Production: `https://YOUR-DOMAIN/auth/meta/callback`
   - Dev (if using tunnel): `https://YOUR-TUNNEL.ngrok-free.app/auth/meta/callback`
3. Save.

### 5. OAuth scopes

Iris uses `instagram_business_*` scopes. Confirm they are available / requested at login:

- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_comments`
- `instagram_business_manage_insights`
- `instagram_business_manage_messages`

For App Review later: [08 — App Review](./08-app-review.md).

### 6. Development mode — add testers

While the app is not **Live**:

1. App → **Roles** → **Instagram testers** (or equivalent).
2. Add the @username that will connect in Iris.
3. On Instagram, accept the tester invite (notification or email).

### 7. Generate webhook verify token

In terminal:

```bash
openssl rand -hex 20
```

Save the value — it becomes `META_WEBHOOK_VERIFY_TOKEN` in step [03](./03-variaveis-de-ambiente/).

## Checklist

- [ ] App created (e.g. IGIris)
- [ ] Instagram API / Instagram Login enabled
- [ ] `META_INSTAGRAM_APP_ID` and `META_INSTAGRAM_APP_SECRET` copied
- [ ] `META_APP_ID` and `META_APP_SECRET` (Basic) noted
- [ ] Redirect URI registered with correct domain
- [ ] Instagram account added as tester (if Development)
- [ ] `META_WEBHOOK_VERIFY_TOKEN` generated

## Next step

→ [03 — Environment variables](./03-variaveis-de-ambiente/)
