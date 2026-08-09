#!/usr/bin/env python3
"""Bootstrap Iris v1 user stories and sprints."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = [sys.executable, str(ROOT / ".agent/scripts/meridian_delivery.py")]


def run(*args: str, stdin: str | None = None) -> str:
    result = subprocess.run(
        CLI + list(args),
        capture_output=True,
        text=True,
        cwd=ROOT,
        input=stdin,
    )
    if result.returncode != 0:
        raise RuntimeError(f"{' '.join(args)}\n{result.stderr}")
    return result.stdout.strip()


def create_us(epic: str, title: str, moscow: str, done_when: str, why: str, where: str, acceptance: list[str], depends: list[str] | None = None) -> str:
    us_id = run("create-us", "--title", title, "--epic", epic, "--version", "v1", "--moscow", moscow, "--done-when", done_when)
    deps = ", ".join(depends) if depends else ""
    deps_yaml = f"[{deps}]" if deps else "[]"
    acc_lines = "\n".join(f"- [ ] {a}" for a in acceptance)
    body = f"""---
id: {us_id}
title: {title}
epic: {epic}
version: v1
sprint:
status: ❌
moscow: {moscow}
depends_on: {deps_yaml}
ready: false
done_when: "{done_when}"
tests: required
tests_status: pending
---

# {us_id} — {title}

**As** operador editorial ou agente de IA,
**I want** {title.lower()},
**so that** o fluxo editorial do Instagram fique centralizado no Iris.

## Intent

### Acceptance

{acc_lines}

### Why

{why}

### Where

{where}

## Plan

### Approach

_A preencher em /refine-us._

### Architecture refs

- `docs/05_architecture.md`

### API / DB impact

- Ver epic {epic}

### Security notes

- _n/a_ ou Bearer conforme `02_security.md`

### Related decisions

- _n/a_

### Planned

- [ ] **manual** — verificar acceptance após implementação
- [ ] **automated** — `pnpm test` quando aplicável

## Record

_Pendente — /complete-us._
"""
    run("update-us", us_id, stdin=body)
    return us_id


STORIES = [
    dict(
        epic="EPIC-1",
        title="Scaffold repositório e estrutura SRP",
        moscow="Must",
        done_when="Pastas domain ports adapters api workers agents existem e server.ts inicia.",
        why="Iris precisa de base limpa separada do Casper, com SRP desde o primeiro commit para não acumular dívida.",
        where="Primeira US da v1; desbloqueia migrations e rotas API.",
        acceptance=[
            "Estrutura `src/domain`, `src/ports`, `src/adapters`, `src/api`, `src/workers`, `src/agents` existe",
            "`pnpm dev` inicia processo sem erro (mesmo com handlers stub)",
            "Nenhum import de pacotes Casper/open-slide",
        ],
        depends=None,
    ),
    dict(
        epic="EPIC-1",
        title="SQLite e migrations iniciais",
        moscow="Must",
        done_when="Migrations aplicam tabelas posts comments api_keys meta_tokens no boot.",
        why="Persistência é requisito para calendário editorial e auditoria de agentes.",
        where="Depende do scaffold; desbloqueia CRUD de posts.",
        acceptance=[
            "Migration timestampada em `migrations/` cria tabelas de `06_database.md`",
            "Boot aplica migrations idempotentemente",
            "Teste automatizado cobre apply migration em DB temporário",
        ],
        depends=["US-0001"],
    ),
    dict(
        epic="EPIC-1",
        title="HTTP server bootstrap e health check",
        moscow="Must",
        done_when="GET /health retorna 200; public/ servido em /.",
        why="Mini-server único serve API, UI e webhooks — precisa de entrypoint estável.",
        where="Fecha sprint v1-S1; habilita testes de integração HTTP.",
        acceptance=[
            "GET `/health` → `{\"ok\":true}`",
            "Arquivos em `public/` acessíveis na raiz",
            "Porta configurável via `PORT` (default 8792)",
        ],
        depends=["US-0001"],
    ),
    dict(
        epic="EPIC-2",
        title="Autenticação Bearer admin e agent",
        moscow="Must",
        done_when="Rotas /api/* rejeitam sem token; admin e agent tokens aceitos.",
        why="Agentes e operador acessam API sem expor SQLite ou tokens Meta.",
        where="Início v1-S2; bloqueia CRUD de posts.",
        acceptance=[
            "401 sem Authorization",
            "403 com token inválido",
            "200 com IRIS_ADMIN_TOKEN ou IRIS_AGENT_TOKEN válido",
            "Comparação timing-safe",
        ],
        depends=["US-0003"],
    ),
    dict(
        epic="EPIC-2",
        title="CRUD de postagens",
        moscow="Must",
        done_when="API completa de posts conforme 07_api_contracts.",
        why="Core do produto — gerenciar postagens é o job principal do Iris.",
        where="v1-S2; após auth.",
        acceptance=[
            "GET /api/posts lista com filtros status",
            "POST cria draft com caption deck_ref media_urls",
            "PATCH atualiza campos",
            "DELETE cancela (status cancelled)",
        ],
        depends=["US-0004", "US-0002"],
    ),
    dict(
        epic="EPIC-2",
        title="Agendamento e validação de scheduled_at",
        moscow="Must",
        done_when="Post pode ir para scheduled com data futura validada no domain.",
        why="Agendamento é diferencial vs post manual no app IG.",
        where="Fecha lógica editorial antes da UI e Meta.",
        acceptance=[
            "scheduled_at no passado rejeitado",
            "status muda para scheduled quando data válida",
            "Domain testa transições de status",
        ],
        depends=["US-0005"],
    ),
    dict(
        epic="EPIC-3",
        title="UI HTML — lista de postagens",
        moscow="Must",
        done_when="index.html lista posts com status badges responsivo.",
        why="Operador precisa ver calendário sem ferramenta externa.",
        where="v1-S3; consome API de posts.",
        acceptance=[
            "Página carrega lista via GET /api/posts",
            "Badges de status conforme 09_design_system",
            "Layout responsivo mobile e desktop",
        ],
        depends=["US-0005"],
    ),
    dict(
        epic="EPIC-3",
        title="SSE event bus",
        moscow="Must",
        done_when="Mutações disparam evento SSE; clientes refetch sem polling.",
        why="Sync em tempo real sem martelar o server.",
        where="v1-S3; usado por UI e futuras abas.",
        acceptance=[
            "GET /api/events retorna text/event-stream",
            "POST/PATCH post emite posts-changed",
            "UI reconecta EventSource após disconnect",
        ],
        depends=["US-0003"],
    ),
    dict(
        epic="EPIC-3",
        title="UI — criar e editar postagem",
        moscow="Must",
        done_when="Formulário cria e edita posts via API.",
        why="Operador agenda sem curl ou agente.",
        where="Fecha UI mínima da v1.",
        acceptance=[
            "Form novo post com caption scheduled_at urls",
            "Edição inline ou modal",
            "Lista atualiza via SSE após salvar",
        ],
        depends=["US-0007", "US-0008"],
    ),
    dict(
        epic="EPIC-4",
        title="Adapter Meta Graph API publish",
        moscow="Must",
        done_when="MetaPublisher publica carrossel; testes com mock fetch.",
        why="Publicação oficial é requisito — não post manual.",
        where="v1-S4; integração externa crítica.",
        acceptance=[
            "Port MetaPublisher implementado em adapters/meta",
            "Upload N imagens + carousel publish",
            "Testes unitários com fetch mockado",
        ],
        depends=["US-0006"],
    ),
    dict(
        epic="EPIC-4",
        title="Worker publish-scheduler",
        moscow="Must",
        done_when="Posts scheduled due publicam automaticamente.",
        why="Server é dono do calendário — não depende de cron externo na v1.",
        where="v1-S4; usa MetaPublisher.",
        acceptance=[
            "Tick 60s processa posts due",
            "Sucesso: published + ig_media_id",
            "Falha: failed + error_message",
            "SSE notifica UI",
        ],
        depends=["US-0010", "US-0002"],
    ),
    dict(
        epic="EPIC-4",
        title="Armazenamento seguro de token Meta",
        moscow="Must",
        done_when="meta_tokens persistido criptografado; nunca na API pública.",
        why="Token Meta é segredo de produção.",
        where="v1-S4; prereq para publish real.",
        acceptance=[
            "Tabela meta_tokens usada pelo adapter",
            "Env META_ACCESS_TOKEN ou vault em dev",
            "Nenhum endpoint expõe token",
        ],
        depends=["US-0002"],
    ),
    dict(
        epic="EPIC-5",
        title="Webhook Meta verificação e ingestão",
        moscow="Must",
        done_when="Webhook GET/POST funcionam com assinatura HMAC.",
        why="Comentários entram em tempo real sem polling na API Meta.",
        where="v1-S5.",
        acceptance=[
            "GET retorna hub.challenge",
            "POST valida X-Hub-Signature-256",
            "Comment persistido com ig_comment_id único",
        ],
        depends=["US-0011"],
    ),
    dict(
        epic="EPIC-5",
        title="API e UI de comentários por post",
        moscow="Must",
        done_when="Comentários visíveis na UI por postagem.",
        why="Operador acompanha engajamento no mesmo lugar do calendário.",
        where="v1-S5.",
        acceptance=[
            "GET /api/posts/:id/comments",
            "Painel comments na UI ao selecionar post",
            "SSE comments-changed atualiza painel",
        ],
        depends=["US-0013", "US-0009"],
    ),
    dict(
        epic="EPIC-5",
        title="Resposta manual a comentário",
        moscow="Should",
        done_when="Operador responde via API e Meta recebe reply.",
        why="Fallback antes de automação total.",
        where="v1-S5.",
        acceptance=[
            "POST /api/comments/:id/reply com message",
            "Status comment → replied",
            "Erro Meta → failed visível",
        ],
        depends=["US-0014"],
    ),
    dict(
        epic="EPIC-6",
        title="Kit .agent skills Iris API",
        moscow="Must",
        done_when="Skills documentam listar criar reprogramar posts.",
        why="Agente Cursor opera Iris sem acesso ao banco.",
        where="v1-S6.",
        acceptance=[
            ".agent/skills/ com procedimentos API",
            "Exemplos curl com Bearer",
            "Escopos agent documentados",
        ],
        depends=["US-0005"],
    ),
    dict(
        epic="EPIC-6",
        title="Agente reply-agent e worker comment-responder",
        moscow="Must",
        done_when="Worker gera e envia resposta; agent_runs audita.",
        why="Automação de comentários era objetivo desde o discovery.",
        where="v1-S6; fecha MVP.",
        acceptance=[
            "reply-agent gera texto via LLM port",
            "Worker envia à Meta em comments pending",
            "agent_runs registra cada execução",
        ],
        depends=["US-0014", "US-0012"],
    ),
    dict(
        epic="EPIC-6",
        title="Toggle auto_reply por postagem",
        moscow="Should",
        done_when="auto_reply_enabled controla worker por post.",
        why="Nem todo post deve ter resposta automática.",
        where="v1-S6.",
        acceptance=[
            "Campo auto_reply_enabled em posts",
            "UI toggle por post",
            "Worker ignora comments de posts com flag off",
        ],
        depends=["US-0017"],
    ),
]

SPRINTS = [
    ("v1-S1", "Fundação", [0, 1, 2]),
    ("v1-S2", "Posts API e auth", [3, 4, 5]),
    ("v1-S3", "UI e SSE", [6, 7, 8]),
    ("v1-S4", "Meta publish", [9, 10, 11]),
    ("v1-S5", "Comentários", [12, 13, 14]),
    ("v1-S6", "Agentes", [15, 16, 17]),
]


def main() -> None:
    ids: list[str] = []
    for story in STORIES:
        us_id = create_us(**story)
        ids.append(us_id)
        print(us_id, story["title"])

    for sprint_id, title, indices in SPRINTS:
        story_ids = ",".join(ids[i] for i in indices)
        run(
            "create-sprint",
            "--version", "v1",
            "--id", sprint_id,
            "--title", title,
            "--status", "planned",
            "--stories", story_ids,
        )
        print(sprint_id, title, story_ids)

    print("Done.", len(ids), "stories,", len(SPRINTS), "sprints")


if __name__ == "__main__":
    main()
