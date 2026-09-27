---
title: Conta própria com SQLite no Turso
updated: 2026-09-27
---

# Conta própria com SQLite no Turso

Detalhe de `docs/05_architecture.md` para a v1.31. O servidor continua um. Cada pessoa opera uma cópia do schema editorial que já existe. O Turso cria e hospeda o SQLite. A Iris autentica a pessoa e escolhe qual banco abrir.

Sem as variáveis Turso, o processo sobe como hoje: um arquivo local e a suíte em `:memory:`.

## Banco de controle e banco da conta

Dois papéis, dois bancos.

O banco de controle guarda conta, email, slug, nome do banco Turso, URL e o token daquele banco cifrado. Não tem `posts`, `comments` nem `messages`. É um banco Turso fixo quando `TURSO_ORG` e `TURSO_PLATFORM_TOKEN` existem. O token da Platform API fica só no ambiente do servidor.

O banco da conta é criado na Platform API no grupo `TURSO_GROUP`, região `TURSO_GROUP_LOCATION`. Recebe as migrations em `iris-app/server/migrations/`. O token desse banco é por banco, nunca um token de grupo. O Multi-DB Schemas do Turso não é usado.

O cadastro reaproveita o OTP já existente. A allowlist `IRIS_ADMIN_EMAIL` deixa de ser a única porta quando o controle está ligado. Confirmar o código de um email novo cria o banco. Repetir o login não cria outro. Se a Platform API falhar depois do email confirmado, a conta fica incompleta e o próximo pedido conclui o mesmo registro.

## Sessão e escolha da conexão

O cookie `iris_session` continua assinado com `IRIS_SESSION_SECRET`. O id da conta vai dentro da sessão. O cliente não envia um id solto para escolher o banco.

Cada pedido autenticado e cada chamada MCP abrem o SQLite daquela conta. Os repositórios seguem recebendo uma conexão. A borda (`app-context` e o verificador MCP) é que resolve a conta. Não há `tenant_id` nas tabelas editoriais.

O `node:sqlite` (`DatabaseSync`) permanece para arquivo local e `:memory:`. O Turso remoto entra por um porto de SQL com a mesma superfície de `prepare` / `exec`, implementado pelo cliente libSQL. A suíte não precisa de rede.

O código MCP nasce no banco da conta. O código de A não lista posts de B.

## Mídia por conta

Imagem não vai para o Turso. `post_assets.storage_path` continua relativo. A raiz deixa de ser só `data/media/` e passa a ser `data/tenants/{accountId}/media/` quando a conta existe. Upload, leitura e apagamento usam a sessão. Um `post_id` de outra conta responde como ausente.

Sem Turso, a raiz segue `data/media/`.

## Credenciais Meta da conta

App id, app secret e verify token ficam no SQLite da conta, no mesmo cofre já usado por `page_access_token_vault`. A API devolve o app id e se o segredo existe. Não devolve o segredo.

O início do OAuth usa esse app id, mesmo sem `META_APP_ID` e `META_APP_SECRET` no ambiente. O processo ainda descriptografa o token para chamar a Graph API. Isolar no banco dela não torna o servidor cego na hora de publicar.

No modo sem Turso, as variáveis de ambiente continuam como atalho de uma instalação só.

## Webhook por slug e OAuth

A Meta chama `GET` e `POST /webhooks/meta/{slug}`. O slug, estável desde o cadastro, acha a conta no controle e abre o SQLite dela. O HMAC usa o app secret dessa conta. Assinatura inválida não grava evento. Slug desconhecido responde 404, sem banco padrão.

O redirect OAuth continua uma URL só (`/auth/meta/callback`). O `state` é assinado, com prazo, e carrega a conta. A troca do code usa o app secret dela. Query string solta não escolhe conta.

A tela de setup mostra a URL do webhook e o verify token para a pessoa colar no app dela. O slug não é editável.

## Workers por conta

Publish scheduler, comment responder e message responder não têm cookie. O ciclo lista contas com banco criado no controle e repete o worker que já existe, cada vez com a conexão e a pasta daquela conta. Conta sem Meta é pulada. O erro fica nela. As outras seguem. Cliente libSQL não vaza de uma iteração para a outra.

Sem Turso, o ciclo único no arquivo local permanece.

## Migrations em lote

O cadastro aplica o schema no banco que acaba de nascer. Um comando de deploy percorre as contas e aplica o que falta em `migrations/`. O controle registra a versão de cada conta. Falha numa não reverte as que passaram e não marca a que falhou. Rodar de novo é idempotente e retoma a pendente.

O banco de controle não entra nesse lote. O schema dele sobe com o processo.

## Importação da instalação atual

Um comando copia o `iris.db` local para o SQLite Turso da primeira conta e copia `data/media/` para a pasta dela. `storage_path` relativo permanece válido. O que já está em `meta_connection` viaja com o arquivo. Variáveis `META_APP_*` que nunca foram para o banco não são convertidas. A pessoa as salva na configuração.

O comando é idempotente. Não apaga o arquivo de origem. O email da primeira conta é argumento do comando.

## Fora deste desenho

Cobrança e bloqueio por assinatura. Várias contas Instagram na mesma pessoa. Objeto de imagem dentro do Turso. Réplica embarcada em várias máquinas.
