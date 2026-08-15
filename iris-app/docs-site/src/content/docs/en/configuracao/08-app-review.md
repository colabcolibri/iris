---
title: "08 — App Review"
description: "Go Live for non-tester users"
---

**Time:** variable (Meta review days) · **Who:** Meta app owner

## Goal

Move from **Development** (testers only) to **Live** — any Instagram account can authorize.

## Prerequisites

- Path [01](./01-conta-instagram/)–[05](./05-conectar-instagram-admin/) complete
- Deploy with scopes: `instagram_business_manage_insights`, `instagram_business_manage_messages`
- **Switch account** in Iris header after deploy for new scopes

Iris shortcuts: **Settings → Meta tests (app review)**.

## Test checklist

| Permission | How to test in Iris |
| --------- | ------------ | ------------------- |
| `instagram_business_basic` | Connect Instagram |
| `instagram_business_content_publish` | Calendar → publish |
| `instagram_business_manage_comments` | Webhooks + Comments |
| `instagram_business_manage_insights` | Settings → Test insights |
| `instagram_business_manage_messages` | Settings → Test messages |

## Submit in Meta panel

1. [developers.facebook.com](https://developers.facebook.com) → your app → **App Review**.
2. Verify green counters per permission.
3. Submit with videos/text Meta requires.

## Back to index

→ [Meta index](./)
