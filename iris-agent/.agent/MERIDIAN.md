# Meridian — Iris local agent kit

Operator kit for the **iris-agent** workspace. Canonical source: `iris-agent/.agent/`.

This is not the product server (`iris-app/`). No Node runtime here — only skills, agents, credentials JSON, and `publications/`.

## Sync adapters

```bash
cd iris-agent
./.agent/scripts/sync_cursor_kit.sh
```

See `IDE_ADAPTERS.md`.

## Primary agent

- `@iris-local` — editorial operator (push, schedule, scan publications)

## Primary skill

- `push-publication` — HTTP push to Iris API via `curl` + Bearer token

Product docs (when in monorepo): `../docs/`.
