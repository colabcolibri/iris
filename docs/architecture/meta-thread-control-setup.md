# Guia: liberar DMs presas pelo app do Instagram (thread control)

Este guia é autocontido — não pressupõe que você leu o resto da documentação. Siga os passos na ordem.

## O que este guia resolve

Sintoma: ao tentar responder uma conversa (DM) pelo Iris, aparece o erro:

> A Meta recusou o envio: The action is invalid since it's not the thread owner.

Isso acontece quando **alguém respondeu essa mesma conversa pelo app nativo do Instagram** (celular). A Meta passa o controle da conversa para o app nativo, e a API do Iris fica temporariamente impedida de enviar até a conversa ser "reclamada" de volta.

Sem a configuração deste guia, a única forma de destravar é esperar o **cliente mandar uma nova mensagem** — isso libera a conversa automaticamente. Com a configuração abaixo, o Iris tenta reclamar a conversa de volta sozinho, sem precisar dessa espera.

Essa configuração é **opcional**: sem ela, o Iris continua funcionando normalmente para tudo (publicar posts, responder comentários, enviar DMs em conversas não travadas). Só esse cenário específico de recuperação automática fica indisponível.

## Antes de começar

Você vai precisar de:
- Acesso de administrador ao [Meta Business Manager](https://business.facebook.com) da conta que gerencia a Página/Instagram do Iris.
- Acesso ao app do Iris em [developers.facebook.com](https://developers.facebook.com) (o mesmo app usado na conexão OAuth do Iris).
- Acesso ao ambiente de produção do servidor do Iris (para configurar variáveis de ambiente).

Você **não** vai precisar reconectar a conta Instagram no admin do Iris. A conexão atual não muda.

---

## Passo 1 — Descobrir o ID da Página vinculada

1. Acesse [business.facebook.com](https://business.facebook.com) → ⚙️ **Configurações** → **Contas** → **Páginas**.
2. Localize a Página vinculada à conta Instagram do Iris (ex.: "Colibri").
3. Anote o **ID da Página** (aparece ao lado do nome ou nos detalhes da Página).

> Se você não tem certeza de qual Página está vinculada à conta Instagram, veja em **Contas do Instagram** → selecione a conta → o card mostra "Propriedade de: {Negócio}". Em caso de dúvida, use o chat de suporte da Meta dentro do Business Manager e pergunte: *"Qual Página do Facebook está vinculada à minha conta Instagram [@usuario]?"*

Guarde esse número — ele vai virar a variável `META_PAGE_ID`.

---

## Passo 2 — Habilitar "Login do Facebook para Empresas" no app

Esse passo é necessário porque a permissão `pages_messaging` (que autoriza a recuperação de conversas) só fica disponível depois que esse produto é habilitado no app.

1. Acesse [developers.facebook.com](https://developers.facebook.com) → **Meus apps** → selecione o app do Iris.
2. No menu lateral, procure **"Login do Facebook para Empresas"**. Se não existir ainda, clique em **Adicionar produto** e adicione-o.
3. Dentro dele, clique em **Configurações** → **Criar configuração**.
4. Siga o assistente:
   - **Nome**: qualquer nome identificável, ex. "Iris - Recuperação de threads".
   - **Ativos**: selecione a Página do Passo 1.
   - **Permissões**: marque **`pages_messaging`**. Se a Meta sugerir permissões adicionais como dependência (ex. `pages_show_list`), pode aceitar.
   - **URL de redirecionamento**: use `https://SEU-DOMINIO/auth/meta/callback` (o mesmo domínio de produção do Iris). Essa URL não será de fato usada por usuários — é só um requisito de cadastro do produto.
5. Salve a configuração.

---

## Passo 3 — Criar um Usuário do Sistema dedicado

Um "Usuário do Sistema" é uma identidade técnica (não uma pessoa) usada para gerar tokens de longa duração.

1. Em business.facebook.com → ⚙️ **Configurações** → **Usuários** → **Usuários do sistema**.
2. Clique **+ Adicionar**.
3. Nome sugerido: `Iris - Thread Recovery`.
4. Função: **Employee** (não precisa ser Admin).
5. Crie o usuário.

---

## Passo 4 — Dar ao Usuário do Sistema acesso ao app

Este é o passo mais fácil de esquecer — sem ele, o Passo 5 não mostra nenhuma permissão disponível para selecionar.

1. Ainda em Configurações do Business Manager → **Contas** → **Apps**.
2. Selecione o app do Iris.
3. Encontre a opção de atribuir/adicionar o **Usuário do Sistema** criado no Passo 3 a este app.
4. Dê acesso nível **Employee** (padrão) — não precisa de Admin.
5. Salve.

---

## Passo 5 — Gerar o Page Access Token

1. Volte em **Usuários** → **Usuários do sistema** → clique no usuário criado no Passo 3.
2. Clique **Gerar novo token**.
3. **App**: selecione o app do Iris → Avançar.
4. **Expiração**: escolha a opção mais longa disponível (idealmente "Nunca expira").
5. **Permissões**: marque **`pages_messaging`** (agora deve aparecer na lista, já que o app tem o produto habilitado desde o Passo 2). Se aparecer `pages_show_list`, marque também.
6. Clique **Gerar token**.
7. **Copie o token imediatamente** — a Meta mostra o valor só uma vez.

> ⚠️ **Este token é um segredo com acesso de gerenciamento de mensagens da Página.** Nunca cole ele em chat, issue, PR, print de tela compartilhado ou qualquer lugar que não seja diretamente a variável de ambiente do servidor. Se ele for exposto acidentalmente, volte nesta mesma tela e revogue-o (**Anular tokens**) antes de gerar um novo.

---

## Passo 6 — Configurar as variáveis no servidor

No ambiente de **produção** do servidor do Iris (painel do provedor de hosting, ou `.env` remoto via SSH — nunca no `.env` local que vai pro git), defina:

```env
META_PAGE_ID=<o ID copiado no Passo 1>
META_PAGE_ACCESS_TOKEN=<o token copiado no Passo 5>
```

Reinicie/faça o deploy do servidor para que as novas variáveis sejam lidas.

---

## Passo 7 — Validar que funcionou

1. Peça para alguém responder uma DM de teste **pelo app nativo do Instagram** (celular) numa conversa qualquer.
2. Sem esperar nova mensagem do cliente, tente responder essa mesma conversa **pelo Iris**.
3. Se a mensagem for enviada com sucesso, está funcionando.
4. Se ainda aparecer o erro "not the thread owner", verifique os logs do servidor (procure por `[meta] take_thread_control`) — eles mostram o motivo exato da falha (token inválido, permissão insuficiente, Página errada, etc.).

---

## Perguntas frequentes

**Preciso reconectar a conta Instagram no admin do Iris?**
Não. A conexão OAuth (Instagram Login) usada para tudo mais no Iris não muda.

**O token expira?**
Depende de como foi gerado no Passo 5. Se escolheu "Nunca expira", não. Caso contrário, será necessário repetir o Passo 5 periodicamente.

**E se eu não quiser configurar isso agora?**
Sem problema — sem essas variáveis, o Iris continua funcionando normalmente. Só esse cenário específico (recuperar conversa travada sem esperar nova mensagem do cliente) fica indisponível, e o erro aparece com uma mensagem clara pedindo para aguardar nova mensagem do cliente.

**Onde fica o código que usa essas variáveis?**
`iris-app/server/src/adapters/meta/graph-api-message-sender.ts` — função `takeThreadControl`, acionada automaticamente quando a Meta recusa o envio com o erro de thread ownership.

## Ver também

- `docs/architecture/meta-integration.md` § Recuperação de thread control (DMs) — contexto técnico e referências à API oficial da Meta.
- `docs/08_environments.md` — tabela geral de variáveis de ambiente.
