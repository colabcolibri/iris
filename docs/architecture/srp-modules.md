# SRP module map

## Dependency diagram

```txt
server.ts
  └── api/routes/*
        └── use-cases (thin)
              └── ports (interfaces)
                    ↑
              adapters/sqlite
              adapters/meta
              adapters/sse

workers/*
  └── ports + adapters (same as api)

agents/*
  └── ports only (reply text generation)
```

## Rules

1. `domain/` has zero imports from `adapters/` or `api/`
2. `api/` does not import `adapters/meta` directly — inject via composition root (`server.ts`)
3. New external system = new adapter implementing a port, not new logic in `api/`
4. Workers share repositories with API via injected ports

## Adding a channel (future)

New file `adapters/linkedin/` + port `ChannelPublisher` — posts table gains `channel` column; workers iterate publishers by channel.
