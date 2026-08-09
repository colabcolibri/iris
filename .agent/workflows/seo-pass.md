---
description: Create or update docs/12_marketing_seo.md for public indexable web products.
---

# /seo-pass — marketing SEO contract

$ARGUMENTS

---

## Critical rules

1. Use `seo-strategy` skill + `technical-writer` for doc edits
2. **Skip** when product has no public indexable web (CLI, private API only)
3. Read `seo-checklist.md` before Write
4. **Doc only** — meta/sitemap implementation → `/implement-us`
5. **HAR** for Google Search Console / analytics account creation

---

## Modes (`$ARGUMENTS`)

| Argument | Mode | Action |
| -------- | ---- | ------ |
| _(empty)_ | **full** | Checklist on entire `12` |
| `bootstrap` | **bootstrap** | Infer routes from `05` + stack → create `12` from stub |
| `review` | **review** | Pre go-live gap report |

---

## Output

```txt
Mode: full | bootstrap | review
12_marketing_seo status:
Gaps:
Skipped: yes | no — reason
Next: /implement-us | human approved
```
