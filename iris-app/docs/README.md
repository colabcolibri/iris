# Documentação da aplicação Iris

Guias do produto (admin, Meta, deploy) que **não** fazem parte da documentação Meridian em `../docs/` (scope, arquitetura, API).

| Pasta | Público em `/docs/` | Conteúdo |
| ----- | ------------------- | -------- |
| `inicio/` | Sim | Entrada do guia de uso |
| `uso/` | Sim | Guia do operador (calendário, comentários, DMs, …) |
| `configuracao/` | Não | Setup Meta / deploy (time interno) |

Build: `pnpm docs:build` em `iris-app/` — sync de `inicio` + `uso` → Starlight → `public/docs/`.
