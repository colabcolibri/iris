---
title: Test strategy
status: approved
version: 1.0
updated: 2026-08-09
depends_on: [05_architecture.md, 01_tech_stack.md]
blocks: []
---

# 10 — Test strategy

## Pyramid

| Level | Scope | Tool |
| ----- | ----- | ---- |
| Unit | domain validations, auth helpers, parsers | `node --test` |
| Integration | SQLite repositories, API routes with test DB | `node --test` + temp db file |
| E2E | Manual via HTML + Meta sandbox | Checklist per US |

## Required per US

- US with `tests: required` must have automated test or documented manual steps in `## Plan § Planned`
- Security paths (auth, webhook HMAC) require automated tests

## Test database

- Use `:memory:` or temp file per test suite
- Never run tests against production `data/iris.db`

## Mocking

- Meta Graph API: mock `fetch` in adapter tests
- LLM agent: mock port in worker tests

## CI (future)

```bash
pnpm typecheck
pnpm test
python3 .agent/scripts/validate_meridian.py .
```

## Out of scope v1

- Playwright E2E
- Load testing
