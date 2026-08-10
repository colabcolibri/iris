---
title: Test strategy
status: approved
version: 1.1
updated: 2026-08-10
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

## MCP (v1.6)

| Área | Arquivos de teste |
| ---- | ----------------- |
| Connection code / validate | `src/domain/mcp-connection.test.ts`, `src/api/routes/mcp-auth.routes.test.ts` |
| Transport Streamable HTTP | `src/mcp/streamable-http-handler.test.ts` |
| Tools | `src/mcp/tools/*.test.ts` |
| Kit check script | `test/mcp-check-script.test.ts` |

Validação manual: `cd iris-agent && ./scripts/iris-mcp-check.sh` contra server em dev.

## CI (future)

```bash
pnpm typecheck
pnpm test
python3 .agent/scripts/validate_meridian.py .
```

## Out of scope v1

- Playwright E2E
- Load testing
