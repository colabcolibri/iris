# 06 — Receptor primário (Handover)

**Tempo:** ~10 min · **Quem:** admin da Página Facebook vinculada ao Instagram

## Objetivo

Definir o app (ex.: **IGIris**) como **Receptor primário** das mensagens Instagram. Sem isso, o controle da conversa fica na Caixa de Entrada do Meta Business Suite e a API recusa envio com *not the thread owner*.

**Não usa variável de ambiente** — é configuração na Página Facebook.

## Quando fazer

- Antes de usar o agente de DMs em produção.
- Sempre que criar um **novo** app Meta ou trocar de Página.

## Pré-requisitos

- [05 — Conectar Instagram](05-conectar-instagram-admin.md) feito
- Página Facebook vinculada à conta Instagram (ex.: **Colibri**)
- Acesso de administrador à Página

## Passo a passo

### 1. Alternar para o perfil da Página

1. Abra [facebook.com](https://facebook.com) logado.
2. Menu de perfil (canto superior direito).
3. **Alterne para a Página** — ex.: **Colibri** (não seu perfil pessoal).
   - Não aparece? Business Manager → Contas → Páginas → confirme que você é admin.

### 2. Abrir Mensagens Avançadas

1. Com perfil da **Página** ativo → **Configurações**.
2. Menu lateral: **Nova experiência de páginas** → **Mensagens Avançadas**.

Atalho (após trocar para a Página):  
[facebook.com/settings/?tab=advanced_messaging](https://www.facebook.com/settings/?tab=advanced_messaging)

### 3. Configurar receptor do Instagram

1. Seção **Receptores de aplicativos**.
2. Ao lado de **Configurações do Instagram** → **Configurar**.
3. Selecione seu app → ex.: **IGIris**.
4. Defina como **Receptor primário**.
5. **Salvar**.

### 4. Validar

1. Envie uma DM de teste para a conta Instagram conectada ao Iris.
2. Responda pelo Iris (admin ou aprovação automática).
3. Mensagem deve sair **sem** erro `thread_owner`.

## O que muda

| Antes | Depois |
| ----- | ------ |
| Controle no Business Suite / superfície padrão | App assume controle quando webhook de mensagem dispara |
| API falha com `thread_owner` no fluxo normal | Envio pela API funciona na maioria dos casos |

Isso **não** substitui o token OAuth do Iris — só define quem "manda" na conversa (Handover Protocol).

## Checklist

- [ ] Perfil da **Página** ativo (não pessoal)
- [ ] IGIris (seu app) = Receptor primário
- [ ] DM de teste respondida pelo Iris com sucesso

## Próximo passo (recomendado)

→ [07 — Page Access Token](07-page-access-token.md) — fallback quando alguém responde pelo app Instagram no celular.

## Referência Meta

- [Handover Protocol](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
