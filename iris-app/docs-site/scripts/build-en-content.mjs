#!/usr/bin/env node
/**
 * Write English Meta guides (mirrored slugs under en/meta/).
 * Run from repo root: node iris-app/docs-site/scripts/build-en-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../src/content/docs/en/configuracao");

/** @type {Record<string, { title: string; description: string; body: string }>} */
const pages = {
  "index.md": {
    title: "Meta / Instagram — step-by-step guides",
    description: "Full Meta / Instagram setup path for Iris.",
    body: `Complete Iris setup with Meta, **in order**. Follow **01** through **05** on first setup. Steps **06** and **07** are for DMs (direct messages).

## Who does what

| Role | Steps |
| ----- | ----- |
| **Deploy owner** (devops / server owner) | 02, 03, 04 |
| **Instagram operator** (connects the account) | 01, 05 |
| **DM setup** (once per Facebook Page) | 06, 07 |

Each deployment needs its **own Meta app** (BYOA) — credentials do not ship with the repository.

## Path — first-time setup

| # | Guide | What you do | Done when… |
| - | ---- | -------------- | ---------------- |
| 01 | [Professional Instagram account](./01-conta-instagram/) | Convert account to Business or Creator | Account shows as professional in the Instagram app |
| 02 | [Create Meta app](./02-criar-app-meta/) | IGIris app (or your name), Instagram API, redirect URI, testers | App created, Instagram App ID/Secret copied, redirect registered |
| 03 | [Environment variables](./03-variaveis-de-ambiente/) | Local \`.env\` and production panel (Railway, etc.) | Server starts without Meta config errors |
| 04 | [Webhooks](./04-webhooks/) | Public URL, verify token, \`comments\` field (and messages if using DMs) | Meta shows webhook verified (✓) |
| 05 | [Connect in Iris admin](./05-conectar-instagram-admin/) | OAuth in admin header | Header shows connected @user; publish/comments work |

## Path — messages (DMs)

Do this **after** the path above if Iris replies to DMs.

| # | Guide | What you do | Done when… |
| - | ---- | -------------- | ---------------- |
| 06 | [Primary receiver (Handover)](./06-mensagens-receptor-primario/) | IGIris as primary receiver on Facebook Page | Test DM is answered by Iris without \`thread_owner\` |
| 07 | [Page Access Token](./07-page-access-token/) | Page token with \`pages_messaging\` → \`META_PAGE_*\` | \`debug_token\` shows \`pages_messaging\`; error \`#210\` gone from logs |

## App Review (public production)

| # | Guide | When |
| - | ---- | ------ |
| 08 | [App Review](./08-app-review/) | Development mode only serves testers; submit review for external users |

## If something goes wrong

→ [Troubleshooting](./troubleshooting/) — symptoms, cause, and link to the right step.

## Technical reference (developers)

→ [Integration reference](./referencia-tecnica/) — publish, comments, insights flows, runtime error codes.

## Example values (replace with yours)

| Item | Example |
| ---- | ----- |
| Meta app | IGIris |
| Facebook Page | Your Page name |
| \`META_PAGE_ID\` | Your numeric Page ID |
| Production | \`https://your-domain.example\` |
| Graph API | \`META_GRAPH_API_VERSION=v21.0\` (same as Webhooks panel) |
`,
  },
  "01-conta-instagram.md": {
    title: "01 — Professional Instagram account",
    description: "Convert account to Business or Creator",
    body: `**Time:** ~5 min · **Who:** Instagram account operator

## Goal

Iris only works with **Business** or **Creator** accounts. Personal accounts cannot publish or use the comments/messages API.

## Steps

1. Open the **Instagram app** on your phone (or instagram.com while logged in).
2. Go to **Profile** → **☰** menu → **Settings and privacy**.
3. **Account type and tools** → **Switch to professional account**.
4. Choose **Business** or **Creator** (both work with Iris).
5. Follow the assistant (category, contact — skip optional fields).
6. Confirm: **Account type** should show **Professional account**.

## Optional — link Facebook Page

Not required to publish/comments via Instagram Login. **Required** only for steps **06** and **07** (DMs with Handover).

If you will use advanced DMs:

1. In professional account settings → **Facebook Page** → link or create a Page.
2. Note the Page name — you will use it in guides **06** and **07**.

## Checklist

- [ ] Account is Business or Creator
- [ ] (If using advanced DMs) Facebook Page linked

## Next step

→ [02 — Create Meta app](./02-criar-app-meta/)
`,
  },
  "02-criar-app-meta.md": {
    title: "02 — Create Meta app",
    description: "Create Meta app with Instagram API and your domain URLs",
    body: `**Time:** ~20 min · **Who:** deploy owner / Meta app admin

## Goal

Create the app in Meta for Developers with Instagram API and **your** domain URLs.

## Before you start

- Public Iris domain (e.g. \`https://iris.example.com\`) or dev tunnel (ngrok / Cloudflare).
- Redirect URI will be: \`https://YOUR-DOMAIN/auth/meta/callback\`

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
| \`META_INSTAGRAM_APP_ID\` | Instagram App ID |
| \`META_INSTAGRAM_APP_SECRET\` | Instagram App Secret |

Also note for webhooks (HMAC):

| Iris variable | Where to copy |
| ------------- | ----------- |
| \`META_APP_ID\` | Settings → **Basic** → App ID |
| \`META_APP_SECRET\` | Settings → **Basic** → App secret |

### 4. Register redirect URI

1. In **Business login settings** → **OAuth redirect URIs**.
2. Add:
   - Production: \`https://YOUR-DOMAIN/auth/meta/callback\`
   - Dev (if using tunnel): \`https://YOUR-TUNNEL.ngrok-free.app/auth/meta/callback\`
3. Save.

### 5. OAuth scopes

Iris uses \`instagram_business_*\` scopes. Confirm they are available / requested at login:

- \`instagram_business_basic\`
- \`instagram_business_content_publish\`
- \`instagram_business_manage_comments\`
- \`instagram_business_manage_insights\`
- \`instagram_business_manage_messages\`

For App Review later: [08 — App Review](./08-app-review.md).

### 6. Development mode — add testers

While the app is not **Live**:

1. App → **Roles** → **Instagram testers** (or equivalent).
2. Add the @username that will connect in Iris.
3. On Instagram, accept the tester invite (notification or email).

### 7. Generate webhook verify token

In terminal:

\`\`\`bash
openssl rand -hex 20
\`\`\`

Save the value — it becomes \`META_WEBHOOK_VERIFY_TOKEN\` in step [03](./03-variaveis-de-ambiente/).

## Checklist

- [ ] App created (e.g. IGIris)
- [ ] Instagram API / Instagram Login enabled
- [ ] \`META_INSTAGRAM_APP_ID\` and \`META_INSTAGRAM_APP_SECRET\` copied
- [ ] \`META_APP_ID\` and \`META_APP_SECRET\` (Basic) noted
- [ ] Redirect URI registered with correct domain
- [ ] Instagram account added as tester (if Development)
- [ ] \`META_WEBHOOK_VERIFY_TOKEN\` generated

## Next step

→ [03 — Environment variables](./03-variaveis-de-ambiente/)
`,
  },
  "03-variaveis-de-ambiente.md": {
    title: "03 — Environment variables",
    description: "Set Meta credentials on the server",
    body: `**Time:** ~10 min · **Who:** deploy owner

## Goal

Put all Meta credentials on the server — **never** in git.

## Reference files in the repo

| File | Use |
| ------- | --- |
| \`iris-app/.env.example\` | Full list with comments |
| \`iris-app/.env.railway.example\` | Names for Railway / production |
| \`iris-app/.env\` | Local (gitignored) |

## Steps — production

1. Open host panel (e.g. Railway → **iris** service → **Variables**).
2. Set each variable below (values from [step 02](./02-criar-app-meta/)).
3. Save and wait for redeploy (or restart the process).

## Steps — local development

1. Copy \`iris-app/.env.example\` → \`iris-app/.env\` (if not exists).
2. Fill the Meta block below.
3. Start server: \`pnpm dev\`.

## Required variables (Meta)

\`\`\`env
IRIS_PUBLIC_BASE_URL=https://YOUR-DOMAIN
META_INSTAGRAM_APP_ID=
META_INSTAGRAM_APP_SECRET=
META_OAUTH_REDIRECT_URI=https://YOUR-DOMAIN/auth/meta/callback
META_WEBHOOK_VERIFY_TOKEN=
META_GRAPH_API_VERSION=v21.0
META_APP_ID=
META_APP_SECRET=
IRIS_TOKEN_ENCRYPTION_KEY=<64 hex — openssl rand -hex 32>
\`\`\`

## Optional — advanced DMs

Only after guides **06** and **07**:

\`\`\`env
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
\`\`\`

## What does NOT go in .env

| Credential | Where it lives |
| ---------- | --------- |
| Instagram access token (long-lived) | OAuth → \`meta_tokens\` table (admin connection) |
| Legacy \`META_ACCESS_TOKEN\` | Do not use — flow is OAuth via admin |

## Checklist

- [ ] \`IRIS_PUBLIC_BASE_URL\` is HTTPS in production
- [ ] \`META_OAUTH_REDIRECT_URI\` = \`{IRIS_PUBLIC_BASE_URL}/auth/meta/callback\`
- [ ] Instagram App ID ≠ Basic App ID (different fields)
- [ ] Secrets only in panel / gitignored local \`.env\`
- [ ] Server restarted after changes

## Next step

→ [04 — Webhooks](./04-webhooks/)
`,
  },
  "04-webhooks.md": {
    title: "04 — Webhooks",
    description: "Receive comments and messages in real time",
    body: `**Time:** ~15 min · **Who:** deploy owner

## Goal

Meta sends comments (and messages) to Iris in real time.

## Prerequisites

- [03 — Environment variables](./03-variaveis-de-ambiente/) applied
- Iris reachable over **HTTPS** (production or tunnel)
- \`META_WEBHOOK_VERIFY_TOKEN\` set on server

## URLs

| Environment | Callback URL |
| -------- | ------------ |
| Production | \`https://YOUR-DOMAIN/webhooks/meta\` |
| Dev + tunnel | \`https://YOUR-TUNNEL.ngrok-free.app/webhooks/meta\` |

## Steps

### 1. Confirm endpoint responds

\`\`\`bash
curl -s "https://YOUR-DOMAIN/health"
# expected: {"ok":true}
\`\`\`

### 2. Open Webhooks in Meta app

1. [developers.facebook.com](https://developers.facebook.com) → your app.
2. **Webhooks** menu (or **Instagram** product → Webhooks).

### 3. Add subscription

1. **Callback URL:** \`https://YOUR-DOMAIN/webhooks/meta\`
2. **Verify token:** exactly \`META_WEBHOOK_VERIFY_TOKEN\` on server.
3. Click **Verify and save**.

### 4. Subscribe fields

| Field | Iris use |
| ----- | ---------------- |
| \`comments\` | Real-time post comments |
| \`messages\` | DMs (if using message agent) |

### 5. Align API version

Set \`META_GRAPH_API_VERSION=v21.0\` (or same as Webhooks panel).

### 6. Test

Comment on Instagram from another account; event should appear in Iris admin within seconds.

## Checklist

- [ ] Callback URL verified (✓)
- [ ] \`comments\` subscribed
- [ ] \`messages\` subscribed (if using DMs)
- [ ] \`META_GRAPH_API_VERSION\` matches panel
- [ ] Test event received

## Next step

→ [05 — Connect in Iris admin](./05-conectar-instagram-admin/)
`,
  },
  "05-conectar-instagram-admin.md": {
    title: "05 — Connect Instagram in admin",
    description: "OAuth connection from Iris admin",
    body: `**Time:** ~5 min · **Who:** Instagram account operator

## Goal

Authorize Iris to publish, read comments, insights, and messages on behalf of the Instagram account.

Token stays on the server (SQLite) — **do not** copy to \`.env\`.

## Prerequisites

- Steps [01](./01-conta-instagram/)–[04](./04-webhooks/) done
- Iris running with correct Meta variables
- Instagram account is app **tester** (Development) or app is **Live**

## Steps

1. Open admin at your domain (or \`http://127.0.0.1:8792\` locally).
2. Log in (OTP to \`IRIS_ADMIN_EMAIL\`).
3. Header → **Connect Instagram** → authorize on Meta.
4. Confirm @username in header.

If you changed scopes in Meta developers:

1. Header → Instagram menu → **Switch account**.
2. Re-authorize — old token lacks new scopes.

## Checklist

- [ ] @username in header
- [ ] Optional: test publish / comment via webhook

## Next step (DMs only)

→ [06 — Primary receiver](./06-mensagens-receptor-primario/)

Otherwise basic Meta setup is **complete**. For public production → [08 — App Review](./08-app-review/).
`,
  },
  "06-mensagens-receptor-primario.md": {
    title: "06 — Primary receiver (Handover)",
    description: "Set app as primary message receiver",
    body: `**Time:** ~10 min · **Who:** Facebook Page admin linked to Instagram

## Goal

Set your app (e.g. **IGIris**) as **Primary receiver** for Instagram messages. Without this, API send fails with *not the thread owner*.

**No environment variable** — configuration on Facebook Page.

## When

- Before using DM agent in production.
- Whenever you create a **new** Meta app or change Page.

## Prerequisites

- [05 — Connect Instagram](./05-conectar-instagram-admin/) done
- Facebook Page linked to Instagram
- Page admin access

## Steps

1. Open [facebook.com](https://facebook.com) and **switch to Page profile** (not personal).
2. **Settings** → **New Pages experience** → **Advanced messaging**.
3. **App receivers** → **Instagram settings** → **Configure**.
4. Select your app → set as **Primary receiver** → **Save**.
5. Send test DM; Iris should reply without \`thread_owner\` error.

## Checklist

- [ ] **Page** profile active
- [ ] App = Primary receiver
- [ ] Test DM answered by Iris

## Next step

→ [07 — Page Access Token](./07-page-access-token/)

## Meta reference

- [Handover Protocol](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
`,
  },
  "07-page-access-token.md": {
    title: "07 — Page Access Token (DMs)",
    description: "Recover threads after native Instagram replies",
    body: `**Time:** ~30 min · **Who:** Business Manager admin + deploy

## Goal

Configure \`META_PAGE_ID\` and \`META_PAGE_ACCESS_TOKEN\` so Iris recovers conversations when someone replied via the **native Instagram app**.

Iris calls \`take_thread_control\` automatically — you only set variables.

## When

- After [06 — Primary receiver](./06-mensagens-receptor-primario/).
- When logs show \`take_thread_control failed\` or error \`#210\`.

## What NOT to put in \`META_PAGE_ACCESS_TOKEN\`

| Token | Works? |
| ----- | ------ |
| Admin OAuth token (Instagram Login) | ❌ |
| Personal / Graph API Explorer token | ❌ |
| System User **without** \`pages_messaging\` | ❌ (#210) |
| Page Access Token with \`pages_messaging\` | ✅ |

## Summary steps

1. Note Page ID in Business Manager → \`META_PAGE_ID\`.
2. Enable Facebook Login for Business on app; create configuration with \`pages_messaging\`.
3. Create System User; assign to app.
4. Generate token with \`pages_messaging\` and Page selected.
5. Validate with \`debug_token\` (\`is_valid: true\`, \`pages_messaging\` in scopes).
6. Set on server and redeploy.

\`\`\`env
META_PAGE_ID=YOUR_PAGE_ID
META_PAGE_ACCESS_TOKEN=<token from step 4>
\`\`\`

## Security

- Never commit the token.
- If leaked: revoke in Business Manager and regenerate.

## Checklist

- [ ] \`META_PAGE_ID\` correct
- [ ] Token validated with \`debug_token\`
- [ ] Production variables set + redeploy
- [ ] Post-native-reply test passed

## Back to index

→ [Meta index](./)
`,
  },
  "08-app-review.md": {
    title: "08 — App Review",
    description: "Go Live for non-tester users",
    body: `**Time:** variable (Meta review days) · **Who:** Meta app owner

## Goal

Move from **Development** (testers only) to **Live** — any Instagram account can authorize.

## Prerequisites

- Path [01](./01-conta-instagram/)–[05](./05-conectar-instagram-admin/) complete
- Deploy with scopes: \`instagram_business_manage_insights\`, \`instagram_business_manage_messages\`
- **Switch account** in Iris header after deploy for new scopes

Iris shortcuts: **Settings → Meta tests (app review)**.

## Test checklist

| Permission | How to test in Iris |
| --------- | ------------ | ------------------- |
| \`instagram_business_basic\` | Connect Instagram |
| \`instagram_business_content_publish\` | Calendar → publish |
| \`instagram_business_manage_comments\` | Webhooks + Comments |
| \`instagram_business_manage_insights\` | Settings → Test insights |
| \`instagram_business_manage_messages\` | Settings → Test messages |

## Submit in Meta panel

1. [developers.facebook.com](https://developers.facebook.com) → your app → **App Review**.
2. Verify green counters per permission.
3. Submit with videos/text Meta requires.

## Back to index

→ [Meta index](./)
`,
  },
  "troubleshooting.md": {
    title: "Troubleshooting — Meta / Instagram",
    description: "Symptoms, causes, and fixes",
    body: `Symptom → likely cause → **which guide to redo**.

## OAuth / connection

| Symptom | Cause | Fix |
| ------- | ----- | ------- |
| Redirect URI mismatch | URL not registered | [02](./02-criar-app-meta/) step 4 |
| App not available | Not a tester (Development) | [02](./02-criar-app-meta/) step 6 or [08](./08-app-review/) |
| Connected but no insights/messages | Old token without scopes | [05](./05-conectar-instagram-admin/) → Switch account |
| Wrong \`META_INSTAGRAM_APP_ID\` | Used Basic App ID | [02](./02-criar-app-meta/) step 3 |

## Webhooks

| Symptom | Cause | Fix |
| ------- | ----- | ------- |
| Verification fails | \`META_WEBHOOK_VERIFY_TOKEN\` mismatch | [03](./03-variaveis-de-ambiente/) + [04](./04-webhooks/) |
| Comment missing | \`comments\` not subscribed | [04](./04-webhooks/) step 4 |
| DM missing | \`messages\` not subscribed | [04](./04-webhooks/) step 4 |

## DMs

| Symptom | Cause | Fix |
| ------- | ----- | ------- |
| \`not the thread owner\` | Not primary receiver | [06](./06-mensagens-receptor-primario/) |
| \`#210\` page token required | Wrong \`META_PAGE_ACCESS_TOKEN\` | [07](./07-page-access-token/) |

## Quick Page token check

\`\`\`bash
curl -s "https://graph.facebook.com/debug_token?input_token=TOKEN&access_token=APP_ID|APP_SECRET" \\
  | jq '.data | {type, is_valid, scopes}'
\`\`\`

## Back to full path

→ [Meta index](./)
`,
  },
  "referencia-tecnica.md": {
    title: "Technical reference — Meta integration",
    description: "Developer-oriented integration notes",
    body: `Documentation for **developers**. Step-by-step setup → [index](./).

## BYOA (bring your own app)

Iris reads credentials from environment variables. Each deployment configures its own Meta app.

## OAuth and tokens

- Main flow: **Instagram Login** (\`instagram_business_*\`, \`graph.instagram.com\`).
- Long-lived token: \`meta_tokens\` table after admin OAuth.
- Page Token (\`META_PAGE_ACCESS_TOKEN\`): only \`take_thread_control\` on \`graph.facebook.com\`.

## Publishing (carousel)

1. \`POST /{ig-user-id}/media\` per image
2. Carousel container + \`media_publish\`

## Comments

- Webhook field: \`comments\`
- Reply: \`POST /{comment-id}/replies\`

## DMs — thread control

| Layer | Config | Code |
| ------ | ------ | ------ |
| Primary receiver | Facebook Page (guide 06) | Handover |
| \`take_thread_control\` | \`META_PAGE_*\` (guide 07) | \`graph-api-message-sender.ts\` |

## Links

- [Troubleshooting](./troubleshooting/)
- Repository \`docs/07_api_contracts.md\` — HTTP contracts
- Repository \`docs/08_environments.md\` — environment variables
`,
  },
};

function writePage(filename, { title, description, body }) {
  const content = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\n${body.trim()}\n`;
  fs.writeFileSync(path.join(outDir, filename), content);
}

fs.mkdirSync(outDir, { recursive: true });
for (const [file, page] of Object.entries(pages)) {
  if (file === "referencia-tecnica.md") continue;
  writePage(file, page);
}
console.log(`Wrote ${Object.keys(pages).length - 1} EN files to ${outDir}`);

// EN — home, user guide index, dev reference
const enRoot = path.join(__dirname, "../src/content/docs/en");
const devDir = path.join(enRoot, "dev");
fs.mkdirSync(path.join(enRoot, "inicio"), { recursive: true });
fs.mkdirSync(path.join(enRoot, "uso"), { recursive: true });
fs.mkdirSync(devDir, { recursive: true });

writePageTo(
  path.join(enRoot, "inicio/index.md"),
  "Welcome to Iris documentation",
  "Choose the user guide or setup guide.",
  `Iris schedules Instagram posts, tracks comments and DMs, and can reply with an AI agent in your brand voice.

## User guide

Day-to-day admin: calendar, posts, comments, DMs, products, agents.

→ [User guide](../uso/)

## Setup guide

Meta / Instagram setup: professional account, Meta app, server variables, webhooks, OAuth.

→ [Setup guide](../configuracao/)

## Technical reference

→ [Integration reference](../dev/referencia-tecnica/)
`,
);

writePageTo(
  path.join(enRoot, "uso/index.md"),
  "Iris user guide",
  "How to operate the Iris admin.",
  `How to **use the admin** every day. For installation and Meta setup, see the [setup guide](../configuracao/).

| # | Guide | Topic |
| - | ---- | ----- |
| 01 | [First access](./01-primeiro-acesso/) | Login, connect Instagram |
| 02 | [Calendar & posts](./02-calendario-e-postagens/) | Create and schedule |
| 03 | [Comments](./03-comentarios/) | Inbox and agent |
| 04 | [Messages](./04-mensagens/) | DM inbox |
| 05 | [Products & stores](./05-produtos-e-lojas/) | Catalog sync |
| 06 | [Settings & agents](./06-configuracoes-e-agentes/) | Persona, LLM |
| 07 | [Webhooks health](./07-webhooks-e-monitoramento/) | Is everything OK? |

→ [Usage troubleshooting](./troubleshooting/)
`,
);

const usoEnPages = {
  "01-primeiro-acesso.md": {
    title: "01 — First access",
    description: "Login and connect Instagram",
    body: `Open your Iris admin URL, log in with the email OTP, and connect Instagram from the header if prompted.

→ [02 — Calendar & posts](./02-calendario-e-postagens/)
`,
  },
  "02-calendario-e-postagens.md": {
    title: "02 — Calendar & posts",
    description: "Create, schedule, and publish",
    body: `Use **Calendar**, **List**, or **Kanban** to manage posts. Click **New post**, add images and caption, set date/time, save as **Scheduled** or **Draft**.

→ [03 — Comments](./03-comentarios/)
`,
  },
  "03-comentarios.md": {
    title: "03 — Comments",
    description: "Comment inbox and agent",
    body: `Open **Comments** in the sidebar. Modes: **Automatic**, **Supervised** (you approve), or **Silent**. Adjust tone in **Persona**.

→ [04 — Messages](./04-mensagens/)
`,
  },
  "04-mensagens.md": {
    title: "04 — Messages (DMs)",
    description: "DM inbox",
    body: `Open **Messages**. Reply manually or let the agent run in automatic/supervised mode. After human escalation, AI may pause on that thread.

→ [05 — Products & stores](./05-produtos-e-lojas/)
`,
  },
  "05-produtos-e-lojas.md": {
    title: "05 — Products & stores",
    description: "Catalog and sync",
    body: `Connect a store under **Stores**, run **Sync**, then review **Products**. The agent uses catalog data when answering purchase questions.

→ [06 — Settings & agents](./06-configuracoes-e-agentes/)
`,
  },
  "06-configuracoes-e-agentes.md": {
    title: "06 — Settings & agents",
    description: "Persona, LLM, simulator",
    body: `**Settings** for timezone and notifications. **Persona** for brand voice. **Simulator** to test replies before going automatic.

→ [07 — Webhooks health](./07-webhooks-e-monitoramento/)
`,
  },
  "07-webhooks-e-monitoramento.md": {
    title: "07 — Webhooks & system health",
    description: "Check Meta events",
    body: `**Webhooks** in the admin shows recent Meta events. Recent events = healthy pipeline. No events for days → see [setup webhooks](../configuracao/04-webhooks/).

→ [Usage troubleshooting](./troubleshooting/)
`,
  },
  "troubleshooting.md": {
    title: "Usage troubleshooting",
    description: "Day-to-day issues",
    body: `| Issue | Try |
| ----- | --- |
| No OTP email | Spam folder; confirm \`IRIS_ADMIN_EMAIL\` |
| Post failed | Reconnect Instagram; read error on post |
| No comments | Wait 1–2 min; check Webhooks screen |
| Agent silent | Not in Silent mode? LLM configured on server? |

Server setup → [setup troubleshooting](../configuracao/troubleshooting/)
`,
  },
};

for (const [file, page] of Object.entries(usoEnPages)) {
  writePageTo(path.join(enRoot, "uso", file), page.title, page.description, page.body);
}

writePageTo(
  path.join(devDir, "referencia-tecnica.md"),
  pages["referencia-tecnica.md"].title,
  pages["referencia-tecnica.md"].description,
  pages["referencia-tecnica.md"].body.replaceAll("./)", "../configuracao/)"),
);

// remove legacy en/meta
const legacyEnMeta = path.join(enRoot, "meta");
if (fs.existsSync(legacyEnMeta)) {
  fs.rmSync(legacyEnMeta, { recursive: true, force: true });
  console.log("Removed legacy en/meta/");
}

function writePageTo(filePath, title, description, body) {
  const content = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\n${body.trim()}\n`;
  fs.writeFileSync(filePath, content);
}
