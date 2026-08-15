---
title: "06 — Primary receiver (Handover)"
description: "Set app as primary message receiver"
---

**Time:** ~10 min · **Who:** Facebook Page admin linked to Instagram

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
5. Send test DM; Iris should reply without `thread_owner` error.

## Checklist

- [ ] **Page** profile active
- [ ] App = Primary receiver
- [ ] Test DM answered by Iris

## Next step

→ [07 — Page Access Token](./07-page-access-token/)

## Meta reference

- [Handover Protocol](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
