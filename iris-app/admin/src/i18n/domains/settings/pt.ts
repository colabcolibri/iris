export const settingsPt = {
  page: {
    eyebrow: "Preferências",
    title: "Configurações",
    description:
      "Fuso horário, monitoramento, insights, agentes, MCP e provedor de IA.",
    loading: "Carregando…",
  },
  sections: {
    timezone: {
      id: "timezone",
      title: "Fuso horário editorial",
      description: "Datas e horários no calendário e agendamentos.",
      label: "Fuso horário",
      preview: "Agora no fuso selecionado:",
      save: "Salvar",
      cancel: "Cancelar",
    },
    autoMonitor: {
      id: "auto-monitor",
      title: "Auto-monitoramento",
      description: "Poll de mídias novas no Instagram.",
    },
    insights: {
      id: "insights",
      title: "Insights em lote",
      description: "Atualizar métricas dos posts publicados.",
    },
    commentAgent: {
      id: "comment-agent",
      title: "Agente de comentários",
      description: "Modo global e fila de resposta pública.",
    },
    messageAgent: {
      id: "message-agent",
      title: "Agente de DMs",
      description: "Modo global e fila no inbox privado.",
    },
    mcpConnection: {
      id: "mcp",
      title: "Conexão MCP",
      description: "Cursor, ChatGPT ou Claude.",
    },
    mcpPermissions: {
      id: "mcp-permissions",
      title: "Permissões MCP",
      description: "Leitura, edição e deleção por domínio.",
    },
    llm: {
      id: "llm",
      title: "Provedor de IA",
      description: "API key, URL e modelo dos agentes.",
    },
  },
  timezone: {
    toasts: {
      saved: "Fuso horário salvo.",
      failed: "Falha ao salvar.",
    },
  },
  commentAgent: {
    title: "Agente de comentários",
    description:
      "Modo padrão para posts que seguem a configuração global. Posts com modo próprio têm precedência.",
    globalModeLabel: "Modo global",
    workerIntervalLabel: "Intervalo do worker",
    workerIntervalHint: "Frequência do ciclo que processa a fila de comentários.",
    replyDelayLabel: "Tempo antes de responder",
    replyDelayHint:
      "Aguarda antes de enfileirar a resposta automática (simula tempo humano).",
    delayImmediate: "Imediato",
    delayQueued: "Fila com atraso",
    delayMinutesLabel: "Minutos de atraso",
    loading: "Carregando…",
    toasts: {
      modeUpdated: "Modo global do agente: {mode}.",
      delayQueued: "Fila ativa: resposta após {minutes} min.",
      delayImmediate: "Resposta imediata no próximo ciclo do agente.",
      workerInterval: "Intervalo do worker: {minutes} min.",
      saveFailed: "Falha ao salvar.",
      delayFailed: "Falha ao salvar delay.",
      intervalFailed: "Falha ao salvar intervalo.",
    },
  },
  messageAgent: {
    title: "Agente de mensagens (DM)",
    description:
      "Modo padrão para conversas que seguem a configuração global. Conversas com modo próprio têm precedência.",
    globalModeLabel: "Modo global de DM",
    workerIntervalLabel: "Intervalo do worker",
    workerIntervalHint: "Frequência do ciclo que processa a fila de DMs.",
    replyDelayLabel: "Tempo antes de responder",
    replyDelayHint:
      "Aguarda antes de enfileirar a resposta automática na conversa.",
    delayImmediate: "Imediato",
    delayQueued: "Fila com atraso",
    delayMinutesLabel: "Minutos de atraso",
    loading: "Carregando…",
    toasts: {
      modeUpdated: "Modo global de DM: {mode}.",
      delayQueued: "Fila DM ativa: resposta após {minutes} min.",
      delayImmediate: "Resposta imediata no próximo ciclo do agente de DM.",
      saveFailed: "Falha ao salvar.",
      delayFailed: "Falha ao salvar delay.",
    },
  },
  mcp: {
    title: "Conexão MCP",
    description: "Integre o Iris com Cursor, ChatGPT ou Claude via Model Context Protocol.",
    loading: "Carregando…",
    generate: "Gerar código",
    rotate: "Rotacionar código",
    copyHint: "Copie os campos abaixo agora — o código não será exibido de novo.",
    confirmRotate: {
      title: "Rotacionar código MCP?",
      description:
        "O código atual deixará de funcionar. Atualize Cursor, ChatGPT ou Claude com o novo valor.",
      confirmLabel: "Rotacionar",
    },
    toasts: {
      loadFailed: "Falha ao carregar MCP.",
      generated: "Código MCP gerado. Copie os campos abaixo agora — o código não será exibido de novo.",
      rotated:
        "Código rotacionado. Copie os campos abaixo agora — o código não será exibido de novo.",
      generateFailed: "Falha ao gerar código.",
    },
  },
  mcpPermissions: {
    title: "Permissões MCP",
    description:
      "Controle o que clientes conectados (Cursor, ChatGPT, Claude) podem ler, editar e deletar.",
    loading: "Carregando…",
    save: "Salvar permissões",
    presets: {
      readOnly: {
        label: "Somente leitura",
        description: "Listar e consultar — sem criar, editar ou apagar.",
      },
      editor: {
        label: "Editor",
        description: "Leitura e edição — sem operações destrutivas.",
      },
      full: {
        label: "Completo",
        description: "Mesmo escopo de hoje — todas as tools permitidas.",
      },
      custom: {
        label: "Personalizado",
        description: "Ajuste fino por domínio na matriz abaixo.",
      },
    },
    matrix: {
      domain: "Domínio",
      read: "Leitura",
      write: "Edição",
      delete: "Deleção",
      notApplicable: "—",
    },
    customHint:
      "Selecione o preset {custom} para habilitar a matriz por domínio.",
    customLabel: "Personalizado",
    toasts: {
      loadFailed: "Falha ao carregar permissões MCP.",
      presetApplied: "Preset MCP aplicado.",
      saved: "Permissões MCP salvas.",
      saveFailed: "Falha ao salvar.",
    },
  },
  llm: {
    title: "Provedor de IA",
    description: "Configure API key, URL base e modelo usados pelos agentes.",
    apiKeyLabel: "API key",
    baseUrlLabel: "URL base",
    modelLabel: "Modelo",
    save: "Salvar",
    loading: "Carregando…",
    toasts: {
      saved: "Configurações de IA salvas.",
      failed: "Falha ao salvar.",
      loadFailed: "Falha ao carregar configurações.",
    },
  },
  autoMonitor: {
    title: "Auto-monitoramento",
    description: "Detecta mídias novas publicadas diretamente no Instagram.",
    enabledLabel: "Ativar monitoramento automático",
    save: "Salvar",
    toasts: {
      saved: "Auto-monitoramento atualizado.",
      failed: "Falha ao salvar.",
    },
  },
  insights: {
    title: "Insights em lote",
    description: "Atualiza métricas de engajamento dos posts publicados.",
    refresh: "Atualizar insights",
    refreshing: "Atualizando…",
    lastRun: "Última execução:",
    toasts: {
      started: "Atualização de insights iniciada.",
      completed: "Insights atualizados.",
      failed: "Falha ao atualizar insights.",
    },
  },
};
