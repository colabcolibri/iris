export const messagesPt = {
  page: {
    eyebrow: "Operação",
    title: "Mensagens",
    description:
      "Conversas do Instagram — selecione na lista para ver o histórico e responder.",
    conversationsTab: "Conversas",
    activityTab: "Atividade",
    searchPlaceholder: "Buscar usuário…",
    import: "Importar",
    reloadList: "Recarregar lista",
    back: "Voltar",
    sheetTitle: "Conversas",
    selectConversationTitle: "Selecione uma conversa",
    selectConversationBody:
      "Escolha uma DM na lista ao lado para ver o histórico e responder.",
    loadingConversations: "Carregando conversas…",
    loadingMessages: "Carregando mensagens…",
    loadingConversation: "Carregando conversa…",
  },
  activity: {
    tabs: {
      pendingApproval: {
        label: "Aprovação",
        empty: "Nenhum rascunho aguardando aprovação.",
      },
      recent: {
        label: "Recentes",
        empty: "Nenhuma resposta recente em DM.",
      },
    },
    loading: "Carregando…",
    loadFailed: "Falha ao carregar atividade.",
    retry: "Tentar novamente",
    now: "agora",
    defaultUser: "usuário",
  },
  banners: {
    connectInstagram:
      "Conecte o Instagram em {settingsLink} para importar DMs e sincronizar conversas.",
    settingsLink: "configurações",
    messagingUnsupported:
      "Mensagens diretas exigem uma Page do Facebook vinculada à conta Instagram. Revise a conexão em configurações.",
    realtimeUnavailable:
      "Atualização em tempo real indisponível. A lista será recarregada a cada minuto nesta aba, ou use Importar para buscar conversas no Instagram.",
  },
  empty: {
    noConversationsTitle: "Nenhuma conversa ainda",
    noResultsTitle: "Nada encontrado",
    noConversationsConnected:
      "Use Importar para puxar DMs do Instagram ou aguarde novas mensagens via webhook.",
    noConversationsDisconnected:
      "Conecte o Instagram em Configurações para importar DMs.",
    noResultsBody: "Tente outra busca por usuário ou ID.",
    noMessages: "sem mensagens",
    now: "agora",
  },
  detail: {
    sync: "Sincronizar conversa",
    syncAria: "Sincronizar conversa",
    settings: "Configurações da conversa",
    settingsAria: "Configurações da conversa",
    settingsDescription: "Modo de resposta e briefing específicos desta DM.",
    replyModeInheritHint:
      "Herda o padrão global quando definido como herdar.",
    briefingPlaceholder:
      "Contexto específico desta conversa para a Iris…",
    pendingBadge: "{count} para responder",
    windowOpen: "Janela aberta",
    windowClosed: "Janela fechada",
    pendingBadgeShort: "Pendente",
    cannotReply: "Não é possível responder nesta conversa.",
    metaUnsupported: "Conta Meta sem suporte a conversas via API.",
    emptyMessages:
      "Nenhuma mensagem nesta conversa. Use sincronizar para importar do Instagram.",
    briefing: "Briefing desta conversa",
    briefingHint: "Contexto extra injetado no harness para esta DM.",
    replyMode: "Modo de resposta",
    saveBriefing: "Salvar briefing",
  },
  thread: {
    draftLabel: "Rascunho",
    manualReplyLabel: "Resposta manual",
    generateDraft: "Gerar rascunho",
    generateDraftAi: "Gerar rascunho com IA",
    reply: "Responder",
    send: "Enviar",
    save: "Salvar",
    cancel: "Cancelar",
    deleteDraft: "Deletar rascunho",
    placeholder: "Sua resposta…",
    noText: "(sem texto)",
    viewAudit: "Ver decisão do agente",
    viewReasoning: "Ver raciocínio",
    auditFailed: "Falha ao carregar o histórico do agente.",
    auditNoRun:
      "Nenhum histórico salvo para esta mensagem. Gere um novo rascunho com IA se precisar revisar as etapas.",
    brandBadge: "Marca",
  },
  confirm: {
    deleteDraft: {
      title: "Deletar rascunho?",
      description: "O rascunho será descartado. Nada será enviado na Meta.",
      confirmLabel: "Deletar",
    },
  },
  toasts: {
    loadConversationsFailed: "Falha ao carregar conversas.",
    loadMessagesFailed: "Falha ao carregar mensagens.",
    connectForImport:
      "Conecte uma conta Instagram com Page para importar DMs.",
    inboxSynced: "{count} conversa(s) sincronizada(s) do Instagram.",
    inboxEmpty: "Nenhuma conversa nova encontrada no Instagram.",
    importFailed: "Falha ao importar conversas do Instagram.",
    conversationSynced: "Conversa sincronizada.",
    syncFailed: "Falha ao sincronizar.",
    replyModeUpdated: "Modo de resposta atualizado.",
    replyModeFailed: "Falha ao salvar modo.",
    briefingSaved: "Briefing salvo.",
    briefingFailed: "Falha ao salvar briefing.",
    replySent: "Resposta enviada na Meta.",
    approveFailed: "Falha ao aprovar.",
    draftRemoved: "Rascunho removido.",
    removeDraftFailed: "Falha ao remover rascunho.",
    draftSaved: "Rascunho salvo.",
    saveDraftFailed: "Falha ao salvar rascunho.",
    draftGenerated: "Rascunho gerado.",
    generateDraftFailed: "Falha ao gerar rascunho.",
    messageSent: "Mensagem enviada.",
    sendFailed: "Falha ao enviar.",
  },
};
