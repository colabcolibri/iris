---
title: Conta própria em arquivo SQLite
updated: 2026-09-27
---

# Conta própria em arquivo SQLite

Detalhe de `docs/05_architecture.md` para a v1.31. O servidor continua um. Cada pessoa opera uma cópia do schema editorial que já existe, num arquivo no disco da VPS. A Iris autentica a pessoa e escolhe qual arquivo abrir.

O processo que sobe com `pnpm dev` faz isso sempre. O controle fica em `data/control.db`. O arquivo da pessoa fica em `data/tenants/{id}/iris.db`. A suíte de testes, sem pedir tenancy, continua num arquivo só.

## Banco de controle e banco da conta

Dois papéis, dois arquivos.

O banco de controle guarda conta, email e slug. Não tem `posts`, `comments` nem `messages`. Não há banco na nuvem e não há token de plataforma.

O arquivo da conta recebe as migrations em `iris-app/server/migrations/`. O cadastro reaproveita o OTP já existente. Confirmar o código de um email novo cria o arquivo. Repetir o login não cria outro.

## Sessão e escolha da conexão

O cookie `iris_session` continua assinado com `IRIS_SESSION_SECRET`. O id da conta vai dentro da sessão. Uma sessão antiga, sem esse id, não abre o arquivo editorial: a pessoa entra de novo.

Cada pedido autenticado e cada chamada MCP abrem o SQLite daquela conta. Os repositórios seguem recebendo uma conexão. A borda (`app-context` e o verificador MCP) é que resolve a conta. Não há `tenant_id` nas tabelas editoriais.

O `node:sqlite` (`DatabaseSync`) abre o arquivo. O código MCP nasce no banco da conta. O código de A não lista posts de B.

## Mídia por conta

Imagem fica em disco. `post_assets.storage_path` continua relativo. A raiz é `data/tenants/{accountId}/media/`. Upload, leitura e apagamento usam a sessão. Um `post_id` de outra conta responde como ausente.

## Credenciais Meta

O app da Meta é um só, o da Iris. App id, app secret e verify token ficam no ambiente do servidor (`META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`). A conta não guarda esses segredos e a tela dela não pede para colar.

A pessoa conecta o Instagram profissional. O token dessa conexão fica cifrado no SQLite dela, como já acontece com `meta_connection`. Publicação, comentário e mensagem usam esse token.

## Webhook único e OAuth

A Meta chama `GET` e `POST /webhooks/meta`, a URL do app da Iris. A assinatura usa o app secret do servidor. O `entry.id` é o Instagram da conta. A Iris abre o SQLite de quem conectou esse id. Assinatura inválida não grava. Id sem conta responde 200 e não escolhe banco.

O redirect OAuth continua `/auth/meta/callback`. O `state` é assinado, com prazo, e carrega a conta. A troca do code usa o app secret da Iris. O token resultante grava no banco dela.

A tela da pessoa é o botão de conectar. A URL de webhook e o verify token ficam na configuração do servidor, não na conta.

## Workers por conta

Publish scheduler, comment responder, message responder, retenção e o monitor de mídia não têm cookie. O ciclo lista contas com arquivo criado no controle e repete o worker que já existe, cada vez com a conexão e a pasta daquela conta. Conta sem Meta é pulada. O erro fica nela. As outras seguem. Retenção e monitor respeitam o intervalo de cada conta.

A suíte de testes, sem tenancy, mantém o ciclo único no arquivo local.

## Migrations em lote

O cadastro aplica o schema no banco que acaba de nascer. Um comando de deploy percorre as contas e aplica o que falta em `migrations/`. O controle registra a versão de cada conta. Falha numa não reverte as que passaram e não marca a que falhou. Rodar de novo é idempotente e retoma a pendente.

O banco de controle não entra nesse lote. O schema dele sobe com o processo.

## Importação da instalação atual

`importInstallation` copia um `iris.db` de arquivo para o arquivo da conta e copia `data/media/` para a pasta dela. `storage_path` relativo permanece válido. O que já está em `meta_connection` viaja com o arquivo. App id, app secret e verify token não viajam: continuam no ambiente do servidor.

A cópia é idempotente se a conta já tem posts. Não apaga o arquivo de origem. Não há comando de deploy ligado a isso.

## Fora deste desenho

Cobrança e bloqueio por assinatura. Várias contas Instagram na mesma pessoa. Réplica embarcada em várias máquinas. Lista de cadastros para o operador.
