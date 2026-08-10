# SRP module map

## Dependency diagram

```txt
iris-app/src/server.ts
  └── api/routes/*
  └── mcp/*                    # gateway MCP stateless por request
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

iris-agent/.agent/skills/
  push-publication/            ← push em lote via REST (curl)
  mcp-connection/              ← setup MCP (Cursor, ChatGPT, Claude)
```

## Rules

1. `domain/` zero imports de `adapters/` ou `api/`
2. `adapters/media-storage/` único dono de `data/media/`
3. `adapters/image-optimizer/` único lugar com sharp — chamado só no upload
4. Publish worker lê `MediaStorage` + `PostRepository` — nunca URLs externas na v1
5. Nenhum módulo em `src/` referencia Casper ou `publications/`
6. `src/mcp/` registra tools que delegam aos mesmos use-cases do REST — sem lógica duplicada de domínio

## Agente local vs server

| Onde | Responsabilidade |
| ---- | ---------------- |
| `iris-agent/publications/` + skill push | Montar pacote, upload REST, atualizar post.md |
| `iris-agent/.agent/skills/mcp-connection` | Configurar clients MCP (Cursor, ChatGPT, Claude) |
| `iris-app/src/api` | Receber bytes, persistir, agendar |
| `iris-app/src/mcp` | Transport MCP + tools editoriais |
| `iris-app/src/workers` | Publicar no IG no horário |
