# Guia de escrita — documentação de uso do Iris

Este guia é para quem vai **criar ou atualizar** artigos em `docs/uso/`. Ele existe para que qualquer pessoa do time — não só quem escreveu o artigo original — consiga manter o mesmo padrão. Não é sobre o produto: é sobre como escrever sobre o produto.

Leitor-alvo de tudo em `docs/uso/`: o **operador** do admin Iris. Alguém que usa o painel no dia a dia para publicar conteúdo, responder comentários/DMs e configurar o agente de IA — não necessariamente alguém técnico. Nunca escreva pensando em quem já lê código.

## Regra de ouro

Se ao ler a página um operador sem conhecimento técnico consegue **fazer a tarefa e saber se deu certo**, o artigo está pronto. Se ele precisa perguntar para alguém do time o que um termo significa, o artigo falhou.

## Template padrão

Todo artigo novo em `docs/uso/` segue esta estrutura. Seções marcadas "opcional" só devem faltar quando genuinamente não se aplicam — não por preguiça.

```markdown
# [Nome da funcionalidade em linguagem de usuário]

**Rota:** `/admin/...` · **Para:** [quem usa esta tela / o que ela resolve]

## O que você vai fazer (ou "O que esta tela mostra", se for referência)
1–2 frases orientadas a resultado. "Agendar um post", não "acessar o dialog de criação".

## Pré-requisitos (opcional — obrigatório se houver dependência)
O que precisa estar pronto antes, com link para o artigo que resolve.
Ex.: "Instagram conectado — veja [Conectar Instagram](../uso/conectar-instagram.md)."

## Passo a passo
Numerado. Nomes de botão/campo em **negrito**. Verbos no imperativo.
Termine com **"Como saber que deu certo"**: o sinal visível de sucesso
(mudança de status, texto que aparece, onde o resultado fica visível).

## Imagem
Ao menos 1 screenshot por artigo com fluxo de UI. Se ainda não existe,
adicione a página à lista em [IMAGENS.md](../uso/IMAGENS.md) em vez de deixar
o artigo sem indicação nenhuma.

## Erros comuns (opcional — obrigatório em artigos de tarefa do dia a dia)
Tabela sintoma → o que fazer. Local, específico deste artigo — não
empurre tudo para troubleshooting.md. O troubleshooting.md central
continua existindo como índice consolidado por área.

## Termos usados nesta página (opcional)
Só se a página usa um termo do glossário. Uma frase por termo, com
link para [Glossário](../uso/glossario.md) na primeira menção — não repita
a definição inteira, só ancore.

## Próximos passos
Link(s) para o passo seguinte natural na jornada — a trilha completa,
não só "1 artigo relacionado" solto.
```

## As 6 regras que resolvem os problemas mais comuns

### 1. Todo termo técnico ou interno tem que virar linguagem de operador

Nunca exponha nome de campo de banco, de evento de código, ou de conceito de engenharia sem traduzir. Se o termo é recorrente em vários artigos (ex.: *debounce*, *worker*, *webhook*, *payload*, *token/modelo de IA*), **não redefina em cada página** — use 1 frase curta com link para [glossario.md](../uso/glossario.md).

Errado: `Quando o agente DM detecta caso para humano (notify_operator):`
Certo: `Quando o agente identifica que a conversa precisa de um humano:`

Se o termo técnico é a única forma de descrever algo que o operador de fato vai ver na tela (ex.: um status literal do sistema), mantenha o termo mas explique o efeito prático na mesma frase.

### 2. Todo tutorial termina com "Como saber que deu certo"

Depois do último passo, sempre uma frase dizendo o que o operador vai ver se funcionou (mudança de status, texto de confirmação, onde olhar). Isso reduz ansiedade e chamados de suporte — é o item mais valioso e mais fácil de esquecer.

### 3. Toda dependência vira "Pré-requisitos" explícito, não uma suposição

Se o artigo presume que outra coisa já foi feita (ex.: loja Yampi conectada antes de vincular um produto), isso é uma seção **Pré-requisitos** no topo, com link — não uma frase perdida no meio do passo 3.

### 4. Profundidade proporcional à complexidade real da tela, não ao tempo que sobrou

Se duas telas são "visões do mesmo dado" (ex.: Calendário / Lista / Kanban), elas merecem tratamento comparável. Um artigo de 10 linhas ao lado de um irmão de 30 é sinal de que algo ficou pela metade — volte e complete, não deixe "para depois".

### 5. Nomenclatura canônica — um nome por conceito, sempre

Antes de escrever, confira o nome oficial da tela/feature no [glossario.md](../uso/glossario.md) (seção "Nomes canônicos"). Use sempre esse nome. Se o produto tem um sinônimo confuso (ex.: título da página diz uma coisa, o menu diz outra), cite o sinônimo **uma vez**, entre parênteses, e siga com o nome canônico daí em diante.

### 6. Toda tela nova ganha ao menos 1 imagem — ou uma entrada pendente em IMAGENS.md

Não existe "documentar só com texto porque a tela é simples". Se a captura ainda não existe, adicione a página à lista de pendências em [IMAGENS.md](../uso/IMAGENS.md) — isso mantém a dívida visível em vez de escondida.

## Ao atualizar um artigo existente

- **Mudou um nome de botão/campo na UI?** Atualize o artigo no mesmo PR que muda o código, se possível. Documentação que fica um mês atrás da UI perde a confiança do operador.
- **Adicionou uma feature nova a uma tela documentada?** Adicione a seção correspondente no artigo existente — não crie um artigo novo para meio-recurso de uma tela já coberta.
- **Achou um termo técnico solto num artigo antigo?** Troque por linguagem simples e linke o glossário, mesmo que não seja isso que você foi mexer originalmente. É barato corrigir na hora que você já está ali.
- **Artigo ficando desatualizado por falta de dono?** Ainda assim, qualquer pessoa do time pode e deve corrigir — este guia existe justamente para que não seja preciso ser o autor original para manter o padrão.

## Ao criar um artigo novo

1. Confirme que a tela realmente precisa de artigo próprio (não é sub-tópico de um artigo existente).
2. Escreva usando o [template padrão](#template-padrão) acima.
3. Adicione o link no lugar certo do índice em [README.md](../uso/README.md), dentro do agrupamento por área (não solto no fim).
4. Se a tela tem um fluxo natural de "próximo passo", linke a partir do artigo anterior da jornada também (não só a partir do novo artigo).
5. Rode o checklist final antes de considerar pronto:

## Checklist final (antes de publicar/mergear)

- [ ] Título e primeira frase deixam claro o que o operador consegue fazer aqui
- [ ] Rota e "Para quem" no topo (quando aplicável)
- [ ] Pré-requisitos listados com link, se houver dependência
- [ ] Passo a passo numerado, termina em "Como saber que deu certo"
- [ ] Nenhum termo técnico sem tradução ou link ao glossário
- [ ] Nomenclatura bate com o [glossario.md](../uso/glossario.md) (nomes canônicos)
- [ ] Ao menos 1 imagem, ou entrada adicionada em [IMAGENS.md](../uso/IMAGENS.md)
- [ ] Linkado no [README.md](../uso/README.md), no agrupamento certo
- [ ] "Próximos passos" aponta para o passo seguinte real da jornada do operador

## Fora de escopo para `docs/uso/`

Configuração de servidor, app Meta, variáveis de ambiente e deploy são documentação **interna** (`docs/configuracao/`), não `docs/uso/`. Se um artigo de uso precisa mencionar algo técnico de infraestrutura, a ação do operador é sempre "acione o time técnico" — nunca explique como configurar o lado servidor dentro de `docs/uso/`.
