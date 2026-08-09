#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="python3 $ROOT/.agent/scripts/meridian_delivery.py"
cd "$ROOT"

# Version
$CLI create-version --id v1 --title "Iris MVP — publicação IG e comentários" --status planned --outcome "Operador agenda e publica no IG via API; comentários visíveis; agente responde automaticamente"

$CLI update-version v1 <<'EOF'
---
id: v1
title: Iris MVP — publicação IG e comentários
status: planned
outcome: "Operador e agentes gerenciam postagens; publicação programada via Meta; comentários sincronizados; resposta automática opcional."
---
# v1 — Iris MVP

## Objective

Entregar o mini-server Iris completo: API, UI HTML, integração Meta, webhooks de comentários e agente de resposta.

## Done criteria

- Postagens agendadas publicam via Graph API
- UI mostra posts e comentários com SSE
- Agente Cursor opera via API autenticada
- Worker responde comentários quando habilitado

## Included

- Scaffold SRP, SQLite, auth, posts API, UI, SSE, Meta publish, webhooks, agent kit

## Explicitly out

- Multi-conta IG, LinkedIn, app mobile, UI React
EOF

# Epics
$CLI create-epic --id EPIC-1 --title "Fundação e estrutura SRP" --versions "[v1]" --profiles "[Operador editorial, Agente de IA]" --status active --outcome "Repo Iris com camadas domain/ports/adapters e server HTTP funcional."
$CLI create-epic --id EPIC-2 --title "API de postagens e autenticação" --versions "[v1]" --profiles "[Operador editorial, Agente de IA]" --status active --outcome "CRUD de postagens com Bearer auth para admin e agente."
$CLI create-epic --id EPIC-3 --title "Interface HTML e tempo real" --versions "[v1]" --profiles "[Operador editorial]" --status active --outcome "UI no navegador com SSE, sem polling."
$CLI create-epic --id EPIC-4 --title "Integração Meta — publicação" --versions "[v1]" --profiles "[Operador editorial]" --status active --outcome "Posts agendados publicam via Graph API."
$CLI create-epic --id EPIC-5 --title "Comentários e webhooks" --versions "[v1]" --profiles "[Operador editorial, Sistema Meta]" --status active --outcome "Comentários IG ingeridos e exibidos na UI."
$CLI create-epic --id EPIC-6 --title "Agentes e resposta automática" --versions "[v1]" --profiles "[Agente de IA, Operador editorial]" --status active --outcome "Kit agente + worker de resposta a comentários."

for epic in 1 2 3 4 5 6; do
  $CLI update-epic "EPIC-$epic" <<EOF
---
id: EPIC-$epic
title: $(python3 -c "import json; print({1:'Fundação e estrutura SRP',2:'API de postagens e autenticação',3:'Interface HTML e tempo real',4:'Integração Meta — publicação',5:'Comentários e webhooks',6:'Agentes e resposta automática'}[$epic])")
status: active
versions: [v1]
profiles: [Operador editorial, Agente de IA]
outcome: "Ver sprint v1."
---
# EPIC-$epic

## Capability

Epic $epic do Iris v1 — ver user stories vinculadas.

## Expected outcome

Todas as US do epic em ✅ com evidência.

## Out of scope for this epic

- Ver docs/00_scope.md § Out of initial scope
EOF
done

# User stories
declare -a US_SPECS=(
  "EPIC-1|Scaffold repositório e estrutura SRP|Must|Estrutura src/ com domain, ports, adapters, api, workers, agents e server bootstrap."
  "EPIC-1|SQLite e migrations iniciais|Must|Tabelas posts, comments, api_keys, meta_tokens aplicadas no boot."
  "EPIC-1|HTTP server bootstrap e health check|Must|node:http serve /health e arquivos estáticos de public/."
  "EPIC-2|Autenticação Bearer admin e agent|Must|timingSafeEqual; rotas /api/* exigem token válido."
  "EPIC-2|CRUD de postagens|Must|GET/POST/PATCH/DELETE /api/posts com status draft scheduled published cancelled failed."
  "EPIC-2|Agendamento e validação de scheduled_at|Must|PATCH define scheduled_at; transição para scheduled validada no domain."
  "EPIC-3|UI HTML — lista de postagens|Must|public/index.html lista posts com badges de status responsivo."
  "EPIC-3|SSE event bus|Must|GET /api/events envia posts-changed e comments-changed após mutações."
  "EPIC-3|UI — criar e editar postagem|Must|Formulário cria/edita caption scheduled_at media_urls deck_ref via API."
  "EPIC-4|Adapter Meta Graph API publish|Must|MetaPublisher upload carrossel e publish; mockável em testes."
  "EPIC-4|Worker publish-scheduler|Must|Tick 60s publica posts scheduled due; atualiza ig_media_id ou failed."
  "EPIC-4|Armazenamento seguro de token Meta|Must|meta_tokens com vault; nunca exposto à API pública."
  "EPIC-5|Webhook Meta verificação e ingestão|Must|GET challenge + POST HMAC; persiste comments."
  "EPIC-5|API e UI de comentários por post|Must|GET /api/posts/:id/comments; painel na UI."
  "EPIC-5|Resposta manual a comentário|Should|POST /api/comments/:id/reply envia à Meta."
  "EPIC-6|Kit .agent skills Iris API|Must|Skills para listar criar e reprogramar posts via API."
  "EPIC-6|Agente reply-agent e worker comment-responder|Must|LLM gera resposta; worker envia; agent_runs audita."
  "EPIC-6|Toggle auto_reply por postagem|Should|auto_reply_enabled controla worker por post."
)

US_IDS=()
for spec in "${US_SPECS[@]}"; do
  IFS='|' read -r epic title moscow done <<<"$spec"
  id=$($CLI create-us --title "$title" --epic "$epic" --version v1 --moscow "$moscow" --done-when "$done" | tail -1 | awk '{print $1}')
  US_IDS+=("$id")
done

echo "Created US: ${US_IDS[*]}"

# Sprints
$CLI create-sprint --version v1 --id v1-S1 --title "Fundação" --status planned --stories "${US_IDS[0]},${US_IDS[1]},${US_IDS[2]}"
$CLI create-sprint --version v1 --id v1-S2 --title "Posts API e auth" --status planned --stories "${US_IDS[3]},${US_IDS[4]},${US_IDS[5]}"
$CLI create-sprint --version v1 --id v1-S3 --title "UI e SSE" --status planned --stories "${US_IDS[6]},${US_IDS[7]},${US_IDS[8]}"
$CLI create-sprint --version v1 --id v1-S4 --title "Meta publish" --status planned --stories "${US_IDS[9]},${US_IDS[10]},${US_IDS[11]}"
$CLI create-sprint --version v1 --id v1-S5 --title "Comentários" --status planned --stories "${US_IDS[12]},${US_IDS[13]},${US_IDS[14]}"
$CLI create-sprint --version v1 --id v1-S6 --title "Agentes" --status planned --stories "${US_IDS[15]},${US_IDS[16]},${US_IDS[17]}"

echo "Backlog bootstrap complete."
