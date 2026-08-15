---
title: "05 — Conectar Instagram no admin"
description: "Conectar Instagram no admin"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

**Tempo:** ~5 min · **Quem:** operador da conta Instagram

## O que você vai fazer neste guia

Vai autorizar o Iris a agir em nome da sua conta Instagram (publicar, ler comentários, insights, mensagens). O **token fica só no servidor** (banco SQLite) — você **não** cola token no `.env`.

Ao terminar, o header do admin mostra seu **@usuario** conectado.

## Antes de começar

- Passos **01** a **04** concluídos (conta profissional, app Meta, `.env`, webhook).
- Iris rodando com variáveis Meta corretas.
- Sua conta Instagram é **tester** do app (modo Development) **ou** o app já está **Live**.

## Passo 1 — Entrar no admin

1. Abra o Iris no navegador:
   - Produção: `https://SEU-DOMINIO`
   - Local: `http://127.0.0.1:8792`
2. Faça login com o email configurado em `IRIS_ADMIN_EMAIL` (código OTP por email).

**Como saber que deu certo:** você vê o calendário / dashboard do admin.

## Passo 2 — Iniciar conexão com Instagram

1. No **topo da tela** (header), localize o menu da conta Instagram ou o botão **Conectar Instagram**.
2. Clique em **Conectar** ou **Autorizar**.
3. O navegador redireciona para a página de login da Meta.

## Passo 3 — Autorizar na Meta

1. Faça login com a conta Instagram **correta** (a mesma @usuario que é tester, se em Development).
2. Leia e **aceite todas** as permissões que o Iris solicita.
3. Aguarde o redirect automático de volta para:
   - `https://SEU-DOMINIO/auth/meta/callback`

**Como saber que deu certo:** você volta ao admin sem mensagem de erro na URL.

## Passo 4 — Confirmar no header

1. O header deve mostrar o **@usuario** conectado.
2. (Opcional) **Configurações → Testes Meta** — rode testes de insights ou mensagens.

### Testes rápidos (opcional)

| Ação | Resultado esperado |
| ---- | ------------------ |
| Agendar/publicar post de teste | Status `published` no calendário |
| Comentar no post (outra conta) | Comentário aparece no Iris após webhook |

## Passo 5 — Se você mudou permissões no app Meta

Depois de adicionar scopes novos no developers.facebook.com:

1. Header → menu Instagram → **Trocar conta**.
2. Autorize de novo — o token antigo **não** ganha permissões novas sozinho.

## Problemas comuns

| Sintoma | O que fazer |
| ------- | ----------- |
| “App não disponível” | Conta não é tester (passo 02) ou app não está Live (passo 08) |
| Redirect URI mismatch | Confira redirect no app Meta e `META_OAUTH_REDIRECT_URI` (passo 02 e 03) |
| Conectou mas sem insights/DMs | **Trocar conta** e autorizar de novo |

## Checklist final

- [ ] @usuario aparece no header
- [ ] (Opcional) Publicação de teste ok
- [ ] (Opcional) Comentário de teste chegou

## Próximo passo

**Só se for usar DMs:**

→ [06 — Receptor primário](./06-mensagens-receptor-primario/)

**Configuração básica concluída** se não usa DMs. Para app público (não só testers):

→ [08 — App Review](./08-app-review/)
