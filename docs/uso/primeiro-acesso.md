# Primeiro acesso

**Tempo:** ~3 min · **Para:** operador com email já autorizado

## O que você vai fazer

Entrar no admin Iris com código por email e chegar ao **Calendário** — a tela principal do pipeline editorial.

## Passo 1 — Abrir o admin

1. No navegador, acesse o endereço que o time te passou (ex.: `https://seu-dominio.com/admin`).
2. Se não estiver logado, você verá a rota **`/admin/login`**.

![tela de login com título "Entrar com seu email", campo **Email** e botão **Continuar**; link **Política de privacidade** no rodapé](/docs/images/uso/01-login-email.png)

## Passo 2 — Login com código por email

1. Digite o **email** autorizado (cadastrado pelo administrador do Iris).
2. Clique em **Continuar**.
3. Abra sua caixa de entrada e copie o **código de 6 dígitos**.
4. Na segunda tela (**Código enviado para {email}**), cole os 6 dígitos.
5. Clique em **Entrar**.

**Atalhos nesta tela:**

- **Trocar email** — volta ao passo 1
- **Reenviar código** — se o código expirou

![tela do código com campo **Código de 6 dígitos** e botões **Entrar** / **Trocar email**](/docs/images/uso/02-login-codigo.png)

**Como saber que deu certo:** você cai em **`/admin`** com a visão **Calendário** e a sidebar lateral visível.

## Passo 3 — Conectar o Instagram (se necessário)

Se no header aparecer o aviso *"Conecte sua conta do Instagram para agendar e publicar posts"* ou o botão **Conectar** / **Conectar Instagram**:

1. Clique em **Conectar** no header.
2. Faça login na conta Instagram **profissional** da marca na Meta.
3. Aceite **todas** as permissões solicitadas.
4. Volte ao Iris — o chip verde deve mostrar **`@seu_usuario`**.

![header com botão **Conectar** antes da conexão](/docs/images/uso/06-header-conectar.png)

Se o botão não aparecer e o `@usuario` já estiver visível, a conta já está ligada → pule para o próximo guia.

> **Nota:** se login funciona mas Instagram nunca conecta, peça ao time técnico para validar a instalação. Este guia não cobre configuração de servidor ou app Meta.

## O que você vê depois de entrar

| Área no menu | Para quê |
| ------------ | -------- |
| **Calendário** / **Lista** / **Kanban** | Criar e acompanhar postagens (mesmos dados, visões diferentes) |
| **Comentários** | Monitorar e responder comentários |
| **Mensagens** | Inbox de DMs |
| **Produtos** / **Lojas** | Catálogo para o agente em DMs (Yampi) |
| **Webhooks** / **Execuções** / **Fila do agente** | Saúde operacional |
| **Configurações** | Fuso, agentes, alertas, IA |
| **Persona** | Tom de voz e conteúdo dos agentes |

No header, o badge **Agente: {modo}** (ex.: *Automático*, *Com aprovação*, *Desligado*) reflete o modo global do agente de comentários — clique nele para ir a **Configurações**.

## Próximo passo

→ [Navegação no admin](./navegacao-no-admin.md) · [Calendário — visão geral](./calendario-visao-geral.md)
