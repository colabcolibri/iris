# Iris

Serviço online para **agendar, publicar e gerenciar postagens no Instagram**, com suporte a comentários e agentes de IA via API.

Iris é um produto **independente do Casper** (open-slide). Casper cria conteúdo; Iris entrega no canal.

## Meridian

Este projeto usa o protocolo [Meridian](https://github.com/colabcolibri/meridian). Phase docs em `docs/`; backlog em `.meridian/meridian.db`.

```bash
python3 .agent/scripts/validate_meridian.py .
```

## Dev (após implementação)

```bash
cp .env.example .env
pnpm install
pnpm dev
# UI: http://127.0.0.1:8792/
```
