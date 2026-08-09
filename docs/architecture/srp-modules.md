# SRP module map

## Dependency diagram

```txt
iris-app/src/server.ts
  └── api/routes/*
        └── use-cases
              └── ports
                    ↑
              adapters/sqlite
              adapters/media-storage
              adapters/meta
              adapters/sse

workers/*
  └── ports + adapters

agents/ (server)
  └── LLM reply only

iris-agent/.agent/skills/push-publication/  ← agente LOCAL (kit portável), curl na API; não importa iris-app/src/
```

## Rules

1. `domain/` zero imports de `adapters/` ou `api/`
2. `adapters/media-storage/` único dono de `data/media/`
3. `adapters/image-optimizer/` único lugar com sharp — chamado só no upload
4. Publish worker lê `MediaStorage` + `PostRepository` — nunca URLs externas na v1
5. Nenhum módulo em `src/` referencia Casper ou `publications/`

## Agente local vs server

| Onde | Responsabilidade |
| ---- | ---------------- |
| `iris-app/publications/` + skill push | Montar pacote, upload, atualizar post.md |
| `iris-app/src/api` | Receber bytes, persistir, agendar |
| `iris-app/src/workers` | Publicar no IG no horário |
