export const agentPt = {
  persona: {
    page: {
      eyebrow: "Respostas automáticas",
      title: "Persona da marca",
      description:
        "Identidade, limites e conteúdo editorial dos agentes de comentários e DMs.",
      loading: "Carregando persona…",
      updatedAt: "Atualizado: {date}",
    },
    sections: {
      identity: {
        title: "Identidade da marca",
        description: "Idioma, nome, assinatura e limite de caracteres.",
      },
      commentContent: {
        title: "Conteúdo (comentários)",
        description: "SOUL, página, conhecimento e restrições públicas.",
      },
      dmContent: {
        title: "Conteúdo (DM)",
        description: "Blocos editoriais do message-harness no inbox.",
      },
    },
    fields: {
      responseLanguage: "Idioma das respostas",
      responseLanguageHint:
        "Idioma obrigatório de todas as respostas públicas no Instagram. Os prompts internos do harness ficam em inglês; este idioma é reforçado em triagem, rascunho e verificação.",
      selectLanguage: "Selecione o idioma",
      brandName: "Nome da marca",
      brandNameHint:
        "Nome exibido no topo dos prompts de rascunho. Ajuda a IA a se referir à marca corretamente.",
      brandPlaceholder: "Ex.: Nome da sua marca",
      signatureInstruction: "Instrução de assinatura",
      signatureHint:
        "Como a IA deve encerrar a resposta. Na publicação, corpo e assinatura ficam separados por um ponto em linha própria.",
      signaturePlaceholder: "Ex.: Assine sempre com o nome da equipe ou do atendente.",
      maxChars: "Limite de caracteres",
      maxCharsHint:
        "Teto de caracteres da resposta final no Instagram. O verificador rejeita rascunhos que ultrapassarem este limite.",
      soul: "SOUL",
      soulHint:
        "Voz, personalidade e tom da marca. Usado em respostas completas (tier full).",
      page: "Sobre a página",
      pageHint:
        "Contexto do perfil ou campanha: o que é a conta, público-alvo e objetivo editorial.",
      knowledge: "Base de conhecimento",
      knowledgeHint: "Fatos, links oficiais, preços, políticas e respostas-modelo.",
      restrictions: "Restrições",
      restrictionsHint:
        "O que a IA nunca deve fazer ou prometer — principal filtro de política da marca.",
      dmSoul: "SOUL (DM)",
      dmSoulHint:
        "Tom e personalidade no inbox privado — mais direto que nos comentários públicos.",
      dmPage: "Sobre a página (DM)",
      dmKnowledge: "Base de conhecimento (DM)",
      dmKnowledgeHint:
        "Fatos, links e políticas nas respostas privadas — inclui produtos ativos quando a triagem detectar intenção de compra.",
      dmRestrictions: "Restrições (DM)",
    },
    actions: {
      savePersona: "Salvar persona",
      saveCommentContent: "Salvar conteúdo do agente",
      saveDmContent: "Salvar conteúdo DM",
    },
    toasts: {
      loadFailed: "Falha ao carregar persona.",
      personaSaved: "Persona salva.",
      saveFailed: "Falha ao salvar.",
      commentContentSaved: "Conteúdo do agente salvo.",
      commentContentFailed: "Falha ao salvar conteúdo.",
      dmContentSaved: "Conteúdo DM do agente salvo.",
      dmContentFailed: "Falha ao salvar conteúdo DM.",
    },
  },
  runs: {
    page: {
      eyebrow: "Operação",
      title: "Execuções do agente",
      description:
        "Monitoramento global das runs de auto-resposta — cada execução e suas chamadas.",
      languageNote: "Idioma na persona:",
      backToAll: "Todas as execuções",
      list: "Lista",
      sheetTitle: "Execuções",
      refresh: "Atualizar",
      loading: "Carregando execuções…",
      loadingDetail: "Carregando detalhe…",
      openThread: "abrir thread do comentário",
    },
    filters: {
      allStatuses: "todos os status",
      allTiers: "todos os tiers",
    },
    table: {
      when: "Quando",
      status: "Status",
      trigger: "Trigger",
      tier: "Tier",
      model: "Modelo",
      duration: "Duração",
      tokens: "Tokens",
      tools: "Tools",
      callsOne: "1 chamada",
      callsMany: "{count} chamadas",
    },
    empty: {
      title: "Nenhuma execução",
      body: "Nenhuma run encontrada com os filtros atuais.",
    },
    detail: {
      noAuditTitle: "Sem auditoria",
      noAuditBody: "Sem dados de auditoria para esta execução.",
    },
    terminal: {
      approved: "aprovado",
      approvedSimple: "aprovado (simples)",
      skippedTriage: "ignorado na triagem",
      blockedHarmful: "bloqueado (harmful)",
      rejectedVerify: "rejeitado na verificação",
    },
    toasts: {
      loadFailed: "Falha ao carregar execuções.",
      detailFailed: "Falha ao carregar detalhe.",
    },
  },
  simulator: {
    page: {
      eyebrow: "Lab",
      title: "Simulador",
      description:
        "Monte a conversa e rode o mesmo harness de produção — sem publicar.",
      resultEyebrow: "Lab",
      resultTitle: "Resultado",
      resultDescription: "Resposta proposta e stages do harness no palco.",
      personaLink: "Persona",
      tokenEstimateTitle: "Estimativa heurística de tokens",
    },
    fields: {
      channel: "Canal",
      channelComment: "Comentário",
      channelDm: "DM (mensagens)",
      scenario: "Cenário",
      scenarioDefault: "Cenário",
      language: "Idioma",
      brand: "Marca",
      caption: "Legenda do post",
      carouselSummary: "Resumo do carrossel",
      carouselPlaceholder: "Texto usado pelo harness em vez das imagens.",
      thread: "Thread",
      addMessage: "Mensagem",
      authorPlaceholder: "autor",
      brandCheckbox: "marca",
      targetComment: "Comentário alvo",
      targetAuthorPlaceholder: "@autor",
      run: "Simular resposta",
      running: "Simulando…",
    },
    contentStats: {
      soul: "SOUL",
      page: "Página",
      knowledge: "Knowledge",
      restrictions: "Restrições",
    },
    tokenEstimate: {
      empty: "vazio",
      tokensK: "≈ {value}k tokens",
      tokens: "≈ {value} tokens",
    },
    empty: {
      title: "Monte a thread e rode o harness",
      body: "O palco mostra a resposta proposta e cada chamada (modelo, tokens, verdict) depois da simulação.",
      noApproved: "Nenhuma resposta aprovada nesta simulação.",
    },
    toasts: {
      targetCommentRequired: "Informe o comentário alvo.",
      targetMessageRequired: "Informe a mensagem alvo.",
      simulateFailed: "Falha na simulação.",
    },
  },
};
