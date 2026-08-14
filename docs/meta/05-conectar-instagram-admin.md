# 05 — Conectar Instagram no admin

**Tempo:** ~5 min · **Quem:** operador da conta Instagram

## Objetivo

Autorizar o Iris a publicar, ler comentários, insights e mensagens em nome da conta Instagram.

O token fica no servidor (SQLite) — **não** copie para `.env`.

## Pré-requisitos

- Passos [01](01-conta-instagram.md)–[04](04-webhooks.md) concluídos
- Iris no ar com variáveis Meta corretas
- Conta Instagram é **tester** do app (modo Development) ou app está **Live**

## Passo a passo

### 1. Abrir o admin

1. Acesse `https://SEU-DOMINIO` (ou `http://127.0.0.1:8792` em dev).
2. Faça login (OTP no email configurado em `IRIS_ADMIN_EMAIL`).

### 2. Iniciar OAuth

1. No **header**, clique no menu da conta Instagram (ou **Conectar Instagram**).
2. Clique **Conectar** / **Autorizar**.
3. Você será redirecionado para a Meta.

### 3. Autorizar permissões

1. Faça login na conta Instagram correta (@usuario).
2. Aceite **todas** as permissões solicitadas.
3. Aguarde redirect de volta para `{SEU-DOMINIO}/auth/meta/callback`.

### 4. Confirmar conexão

1. Header deve mostrar o @usuario conectado.
2. **Configurações → Testes Meta** (opcional): rode testes de insights/mensagens.

### 5. Se você mudou scopes no app Meta

Depois de adicionar permissões novas no painel developers:

1. Header → menu Instagram → **Trocar conta**.
2. Autorize de novo — token antigo não tem os scopes novos.

## Checklist

- [ ] @usuario aparece no header
- [ ] Publicação de teste no calendário funciona (opcional)
- [ ] Comentário de teste aparece após webhook (opcional)

## Próximo passo (só se usar DMs)

→ [06 — Receptor primário](06-mensagens-receptor-primario.md)

Se não usa DMs, configuração Meta básica está **concluída**.

Para App Review em produção pública → [08 — App Review](08-app-review.md)
