import type { LandingMessages } from "./types";

export const landingPt: LandingMessages = {
  meta: {
    htmlLang: "pt-BR",
    documentTitle: "Íris — a gestora editorial do seu Instagram",
  },
  brand: {
    name: "Íris",
  },
  nav: {
    howItWorks: "Como funciona",
    features: "Recursos",
    trust: "Confiança",
    pricing: "Implementação",
    faq: "FAQ",
    contact: "Contato",
  },
  hero: {
    eyebrow: "Sua agente editorial e gestora de mídias sociais",
    titleLine1: "O Instagram da sua marca",
    titleLine2Accent: "cuidado todos os dias",
    titleLine2: "do jeito que você quer",
    subtitle:
      "A Íris publica no seu Instagram e responde quem comenta, sempre na voz da sua marca — com o nível de autonomia que você escolher.",
    cta: "Quero conhecer a Íris",
    stage: {
      postHandle: "@estudio.nomade",
      postCaption:
        "Carrossel · bastidores da nova coleção, gravado no ateliê em SP.",
      commentAuthor: "@marianadias",
      commentBody:
        "Adorei o segundo slide! Vocês vão lançar em outras cidades também?",
      replyAuthor: "Estúdio Nômade",
      replyBody:
        "Que alegria saber que curtiu! Por enquanto estamos só em SP, mas Belo Horizonte entra no radar ainda este ano 💜",
      replySignature: "— Íris, assistente virtual do Estúdio Nômade",
      statusLabel: "Respondido automaticamente · dentro da persona da marca",
    },
  },
  workflow: {
    sectionLabel: "01 · Como funciona",
    titleLine1: "Do planejamento à conversa,",
    titleLine2: "sem perder o fio",
    subtitle:
      "Quatro etapas simples conectam o planejamento do conteúdo, a publicação no Instagram e as respostas aos comentários — tudo em um painel pensado para quem cuida da própria marca com atenção, e não no piloto automático.",
    steps: [
      {
        title: "Você (ou seu agente de IA) planeja o conteúdo",
        description:
          "Escreva a legenda e suba as imagens direto no painel, ou peça para o seu assistente de IA (Cursor, Claude ou ChatGPT) preparar o post por você — os dois caminhos chegam no mesmo calendário.",
      },
      {
        title: "Você revisa antes de ir ao ar",
        description:
          "Veja tudo organizado num calendário: o que está em rascunho, o que já tem data marcada e o que já foi publicado. Nada sai sem passar por essa etapa.",
      },
      {
        title: "A Íris publica na hora certa",
        description:
          "No horário agendado, a Íris publica direto na sua conta do Instagram, usando a conexão oficial do próprio Instagram — sem gambiarra, sem intermediário guardando sua senha.",
      },
      {
        title: "A Íris responde os comentários",
        description:
          "Quando alguém comenta no post, a Íris lê o comentário e o contexto da publicação, e escreve uma resposta na voz da sua marca. Você escolhe se quer aprovar cada resposta antes de ela ir ao ar, ou deixar a Íris responder sozinha dentro dos limites que você definiu.",
      },
    ],
  },
  features: {
    sectionLabel: "02 · Recursos",
    title: "Feito para quem publica com",
    titleAccent: "intenção",
    subtitle:
      "Quatro pilares sustentam a operação: seu agente de IA conectado à Íris, um calendário editorial de verdade, comentários respondidos com critério e uma integração oficial e segura com o Instagram.",
    items: [
      {
        title: "Seu agente de IA cria e agenda posts",
        description:
          'Se você já usa um assistente de IA como Cursor, Claude ou ChatGPT, ele pode falar diretamente com a Íris — criar posts, enviar imagens e consultar o calendário sem que você precise abrir o painel. (O nome técnico dessa conexão é "MCP", caso você já tenha ouvido falar.)',
        highlight: true,
      },
      {
        title: "Calendário editorial",
        description:
          "Veja tudo num só lugar: o que está em rascunho, o que já tem data marcada e o que já foi publicado. Organize por quadro (tipo um Trello) ou por mês — a tela atualiza sozinha, sem precisar recarregar a página.",
      },
      {
        title: "Respostas de comentários com critério",
        description:
          "Cada comentário passa por uma checagem em várias etapas antes da Íris responder: ela decide se vale a pena responder, escreve um rascunho e depois revisa o próprio texto — sempre respeitando o tom, os limites e o idioma que você configurou. Dá para testar tudo isso num modo simulação, sem publicar nada de verdade, e depois conferir o histórico de cada resposta.",
      },
      {
        title: "Conexão oficial e seus dados protegidos",
        description:
          "A Íris se conecta ao Instagram pela via oficial da Meta (a empresa dona do Instagram) — a mesma usada por grandes marcas. Isso mantém comentários, posts e estatísticas sempre sincronizados, e a sua conta nunca divide acesso com a de outra marca.",
      },
    ],
  },
  trust: {
    sectionLabel: "03 · Confiança",
    titleLine1: "Você decide o quanto",
    titleLine2: "de autonomia dar.",
    subtitle:
      "A Íris não tem um único modo de operar. Você escolhe o nível de automação — e cada resposta automática ainda passa por uma barreira pensada para isso. É a diferença entre automatizar o Instagram da sua marca e entregar as chaves para um robô.",
    items: [
      {
        title: "Autonomia configurável",
        description:
          "Você pode ligar ou desligar as respostas automáticas quando quiser — para todos os posts de uma vez ou só para um em específico — e ainda escolher um tempo de espera antes do envio, como uma última chance de revisar.",
      },
      {
        title: 'Ninguém consegue "hackear" as respostas',
        description:
          "Já vimos gente tentar enganar assistentes de IA escrevendo instruções escondidas dentro de um comentário. A Íris é treinada para ignorar esse tipo de truque — um comentário não consegue fazer ela fugir do tom, do idioma ou das regras da sua marca.",
      },
      {
        title: "Histórico de tudo que foi respondido",
        description:
          "Cada resposta automática fica registrada no painel, com os passos que a Íris seguiu até chegar naquele texto — para você conferir a qualquer momento e entender como ela pensou.",
      },
      {
        title: "Teste antes de valer pra valer",
        description:
          "Antes de mudar o tom de voz ou as regras da Íris, você pode testar num modo simulação, sem publicar nada de verdade — só depois de aprovar é que a mudança passa a valer nos comentários reais.",
      },
    ],
  },
  pricing: {
    sectionLabel: "04 · Implementação",
    titleLine1: "Uma Íris só sua,",
    titleLine2: "não uma conta compartilhada",
    subtitle:
      "Não é um sistema em que você se cadastra e começa a usar sozinho.",
    manifestoNote:
      "Eu coloco no ar uma versão própria da Íris só para a sua marca, e te ensino a usar.",
    manifestoQuestion:
      "Por que assim, e não vender como um SaaS tradicional, por assinatura?",
    manifestoAnswer:
      "Porque ser desenvolvedor não é a minha ocupação principal, e não pretendo abrir uma startup. A Íris nasceu de ferramentas que criei para o meu próprio uso, e decidi colocar à disposição de outras pessoas. Tenho mais cara de uma pequena boutique, com projetos pontuais para quem realmente vê valor nisso — não de uma empresa de software correndo atrás de milhares de contas.",
    items: [
      {
        title: "Implementação",
        description:
          "Eu configuro a parte técnica: a conexão com o Instagram, o jeito de falar da sua marca e, se você quiser, a ligação com o agente de IA que já usa (Cursor, Claude ou ChatGPT). E te mostro como usar o painel no dia a dia, para você tirar o melhor proveito.",
      },
      {
        title: "Manutenção",
        description:
          "Eu cuido para que fique sempre no ar e funcionando. Ajustes e pedidos fora do combinado inicialmente são cobrados à parte, conforme a necessidade.",
      },
      {
        title: "Atualizações",
        description:
          "A Íris está sempre evoluindo — melhorias e novas funções vão sendo adicionadas com o tempo, e a sua versão recebe essas atualizações.",
      },
    ],
    noteLabel: "Sobre o valor",
    note: "Sem plano ou preço fixo publicado aqui: o valor depende do tamanho da sua marca e do que você precisa. A forma de descobrir é conversando comigo — sem compromisso.",
  },
  faq: {
    sectionLabel: "05 · FAQ",
    title: "Perguntas frequentes",
    subtitle:
      "O essencial sobre a Íris, a conexão com agentes de IA e o que você pode esperar do projeto neste momento.",
    items: [
      {
        question: "O que é a Íris?",
        answer:
          "A Íris cuida do Instagram da sua marca: agenda e publica posts, acompanha os comentários assim que eles chegam e responde as pessoas — sempre na voz da sua marca, com o nível de automação que você escolher.",
      },
      {
        question: "Preciso saber programar ou usar IA para ter a Íris?",
        answer:
          "Não. Você pode usar só o painel — escrever legendas, subir fotos e acompanhar comentários normalmente. A conexão com agentes de IA (Cursor, Claude, ChatGPT) é um recurso a mais, para quem já usa essas ferramentas e quer criar posts direto de lá.",
      },
      {
        question: "O que exatamente meu agente de IA consegue fazer na Íris?",
        answer:
          "Criar e editar posts, enviar fotos, consultar o calendário e ler comentários e estatísticas — como se fosse um assistente editorial. Ele não tem acesso às configurações da conta nem consegue publicar nada sozinho: toda publicação passa pela Íris, no horário agendado.",
      },
      {
        question: "As respostas automáticas são publicadas sem revisão?",
        answer:
          "Você escolhe. Dá para exigir sua aprovação antes de cada resposta ir ao ar, ou deixar a Íris responder sozinha dentro do tom e dos limites que você define. Em qualquer um dos dois casos, também dá para configurar um tempo de espera antes do envio, como uma segurança a mais.",
      },
      {
        question: "Como faço para ter a Íris na minha marca?",
        answer:
          'Não tem cadastro nem botão de "assinar agora". Eu monto e configuro tudo pessoalmente para você, e te ensino a usar. Envie uma mensagem pelo formulário de contato e conversamos sobre o seu caso.',
      },
    ],
  },
  contact: {
    sectionLabel: "06 · Contato",
    title: "Tem interesse?",
    titleAccent: "Vamos conversar",
    bodyBeforeEmail:
      "Cada implementação da Íris é individual, pensada para a sua marca. Se você quer entender o investimento ou tirar dúvidas, envie uma mensagem — a resposta vem de",
    bodyAfterEmail: ".",
    email: "ola@sergioluciano.com",
    form: {
      name: "Nome",
      email: "Email",
      subject: "Assunto",
      message: "Mensagem",
      submit: "Enviar mensagem",
      submitting: "Enviando...",
      success:
        "Obrigado — recebemos sua mensagem e responderemos por email em breve.",
      validationError:
        "Preencha todos os campos. A mensagem precisa ter pelo menos 10 caracteres.",
      genericError:
        "Não foi possível enviar agora. Tente novamente em instantes.",
    },
  },
  footer: {
    blurb:
      "A Íris cuida do Instagram da sua marca: agenda e publica posts, responde comentários com critério e conecta com o seu agente de IA, se você usar um.",
    contact: "Contato",
    privacy: "Privacidade",
  },
};
