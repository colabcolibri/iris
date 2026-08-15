---
title: "Meta / Instagram — step-by-step guides"
description: "Full Meta / Instagram setup path for Iris."
---

Complete Iris setup with Meta, **in order**. Follow **01** through **05** on first setup. Steps **06** and **07** are for DMs (direct messages).

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
| 03 | [Environment variables](./03-variaveis-de-ambiente/) | Local `.env` and production panel (Railway, etc.) | Server starts without Meta config errors |
| 04 | [Webhooks](./04-webhooks/) | Public URL, verify token, `comments` field (and messages if using DMs) | Meta shows webhook verified (✓) |
| 05 | [Connect in Iris admin](./05-conectar-instagram-admin/) | OAuth in admin header | Header shows connected @user; publish/comments work |

## Path — messages (DMs)

Do this **after** the path above if Iris replies to DMs.

| # | Guide | What you do | Done when… |
| - | ---- | -------------- | ---------------- |
| 06 | [Primary receiver (Handover)](./06-mensagens-receptor-primario/) | IGIris as primary receiver on Facebook Page | Test DM is answered by Iris without `thread_owner` |
| 07 | [Page Access Token](./07-page-access-token/) | Page token with `pages_messaging` → `META_PAGE_*` | `debug_token` shows `pages_messaging`; error `#210` gone from logs |

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
| `META_PAGE_ID` | Your numeric Page ID |
| Production | `https://your-domain.example` |
| Graph API | `META_GRAPH_API_VERSION=v21.0` (same as Webhooks panel) |
