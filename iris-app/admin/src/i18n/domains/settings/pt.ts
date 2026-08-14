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
    operatorNotifications: {
      id: "operator-notifications",
      title: "Alertas do operador",
      description: "Email quando o agente DM escala um caso para revisão humana.",
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
    workerIntervalHint:
      "De quanto em quanto o agente verifica a fila no banco (comentários e DMs compartilham o mesmo ciclo). Padrão: 5 minutos.",
    workerIntervalHintShort:
      "Frequência do ciclo que processa a fila de comentários.",
    replyDebounceLabel: "Janela de debounce",
    replyDebounceHint:
      "Aguarda {debounce} após o último comentário do mesmo autor no post antes de gerar a resposta. Se o autor comentar de novo nesse intervalo, o timer reinicia e só o comentário mais recente dele é respondido. Cadência real: debounce + até {tick} min até o próximo ciclo do worker.",
    debounceMinutesLabel: "Minutos de debounce ({min}–{max})",
    replyDelayLabel: "Tempo antes de responder",
    replyDelayHint:
      "Padrão: imediato no próximo ciclo. Com fila, o agente aguarda o intervalo antes do harness — a fila fica no banco e sobrevive a reinícios.",
    replyDelayCadenceDelayed:
      " Cadência real: resposta após {delay} min + até {tick} min até o próximo ciclo.",
    replyDelayCadenceImmediate:
      " Cadência real: até {tick} min até o próximo ciclo.",
    delayImmediate: "Resposta imediata",
    delayQueued: "Fila com delay",
    delayMinutesLabel: "Minutos de espera ({min}–{max})",
    maxAgeLabel: "Janela de resposta",
    maxAgeHint:
      "A Iris só responde comentários dos últimos X dias — no import, no webhook e na fila automática. Comentários mais antigos são ignorados.",
    maxAgeDaysLabel: "Dias de histórico ({min}–{max})",
    loading: "Carregando…",
    toasts: {
      modeUpdated: "Modo global do agente: {mode}.",
      debounceUpdated: "Debounce de comentários: {debounce}.",
      debounceFailed: "Falha ao salvar debounce.",
      delayQueued: "Fila ativa: resposta após {minutes} min.",
      delayImmediate: "Resposta imediata no próximo ciclo do agente.",
      workerInterval: "Intervalo do worker: {minutes} min.",
      saveFailed: "Falha ao salvar.",
      delayFailed: "Falha ao salvar delay.",
      intervalFailed: "Falha ao salvar intervalo.",
      maxAgeUpdated: "Janela de resposta: {days} dias.",
      maxAgeFailed: "Falha ao salvar janela de resposta.",
    },
  },
  messageAgent: {
    title: "Agente de mensagens (DM)",
    description:
      "Modo padrão para conversas que seguem a configuração global. Conversas com modo próprio têm precedência.",
    globalModeLabel: "Modo global",
    workerIntervalLabel: "Intervalo do worker",
    workerIntervalHint:
      "Compartilhado com comentários — configurado no card do agente de comentários. Ciclo atual: {minutes} min.",
    replyDebounceLabel: "Janela de debounce",
    replyDebounceHint:
      "Aguarda {debounce} após a última mensagem do cliente na mesma conversa antes de gerar a resposta. Se chegar outra mensagem nesse intervalo, o timer reinicia e só a mais recente é respondida. Cadência real: debounce + até {tick} min até o próximo ciclo do worker.",
    debounceMinutesLabel: "Minutos de debounce ({min}–{max})",
    replyDelayLabel: "Tempo antes de responder",
    replyDelayHint:
      "Mesma fila persistente usada nos comentários, com settings próprios para DM.",
    replyDelayCadenceDelayed:
      " Cadência real: resposta após {delay} min + até {tick} min até o próximo ciclo.",
    replyDelayCadenceImmediate:
      " Cadência real: até {tick} min até o próximo ciclo.",
    delayImmediate: "Resposta imediata",
    delayQueued: "Fila com delay",
    delayMinutesLabel: "Minutos de espera ({min}–{max})",
    loading: "Carregando…",
    toasts: {
      modeUpdated: "Modo global de DM: {mode}.",
      debounceUpdated: "Debounce DM: {debounce}.",
      debounceFailed: "Falha ao salvar debounce.",
      delayQueued: "Fila DM ativa: resposta após {minutes} min.",
      delayImmediate: "Resposta imediata no próximo ciclo do agente de DM.",
      saveFailed: "Falha ao salvar.",
      delayFailed: "Falha ao salvar delay.",
    },
  },
  mcp: {
    title: "Conexão MCP",
    description:
      "Gere um código e copie os campos para Cursor, ChatGPT ou Claude — cada client no formato que aceita.",
    loading: "Carregando…",
    generate: "Gerar código",
    rotate: "Rotacionar código",
    revoke: "Revogar",
    copyUrl: "Copiar URL",
    copyCode: "Copiar código",
    codeOneTimeTitle: "Código de conexão — copie agora (exibido uma única vez)",
    statusLabel: "Status:",
    statusDatabase: "ativo (gerado na interface)",
    statusEnvironment: "ativo (variável de ambiente)",
    statusDevelopment: "ativo (desenvolvimento)",
    codeHintPrefix: "Termina em",
    notConfigured: "Nenhum código configurado. Gere um para habilitar clientes MCP.",
    envOverride:
      "Há um código definido em {envVar} no servidor. Ele continua válido junto com códigos gerados aqui.",
    copyHint: "Copie os campos abaixo agora — o código não será exibido de novo.",
    confirmRotate: {
      title: "Rotacionar código MCP?",
      description:
        "O código atual deixará de funcionar. Atualize Cursor, ChatGPT ou Claude com o novo valor.",
      confirmLabel: "Rotacionar",
    },
    confirmRevoke: {
      title: "Revogar código MCP?",
      description:
        "Clientes conectados deixarão de autenticar até você gerar um novo código na interface.",
      confirmLabel: "Revogar",
    },
    toasts: {
      loadFailed: "Falha ao carregar MCP.",
      generated:
        "Código MCP gerado. Copie os campos abaixo agora — o código não será exibido de novo.",
      rotated:
        "Código rotacionado. Copie os campos abaixo agora — o código não será exibido de novo.",
      generateFailed: "Falha ao gerar código.",
      revoked: "Código MCP revogado.",
      revokeFailed: "Falha ao revogar.",
      copied: "{label} copiado.",
      copyFailed: "Não foi possível copiar.",
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
    title: "Provedor de IA (respostas automáticas)",
    description:
      "API key, URL e modelo usados pelo agente de comentários. Valores do servidor em .env servem de fallback.",
    apiUrlLabel: "URL da API",
    apiUrlPlaceholder: "https://api.openai.com/v1/chat/completions",
    apiKeyLabel: "API key",
    keyPlaceholderBlank: "••••{hint} — deixe em branco para manter",
    keyPlaceholderNew: "sk-…",
    configuredHint: "Configurado — termina em {hint}{source}",
    baseUrlLabel: "URL base",
    modelLabel: "Modelo",
    modelPlaceholder: "gpt-4o-mini",
    visionLabel: "Modelo suporta visão (analisa imagens do post)",
    save: "Salvar provedor de IA",
    saving: "Salvando…",
    loading: "Carregando…",
    envOverride:
      "Variáveis {envVars} no ambiente estão definidas. O banco tem prioridade quando configurado aqui.",
    toasts: {
      saved: "Configuração de IA salva.",
      failed: "Falha ao salvar.",
      loadFailed: "Falha ao carregar LLM.",
    },
  },
  autoMonitor: {
    title: "Auto-monitoramento de publicações",
    description:
      "Descobre mídias novas no Instagram (poll) e cadastra posts monitorados. Também cadastra no primeiro comentário via webhook se a mídia ainda não existir.",
    onLabel: "Ligado",
    offLabel: "Desligado",
    pollIntervalLabel: "Intervalo do poll",
    pollIntervalHint:
      "Padrão: 5 minutos. A Meta não avisa post novo por webhook — o Iris consulta a lista recente neste intervalo.",
    secondsLabel: "Segundos ({min}–{max})",
    loading: "Carregando…",
    toasts: {
      enabled:
        "Auto-monitoramento ligado — publicações novas entram sozinhas.",
      disabled:
        "Auto-monitoramento desligado — só cadastro manual ou publish Iris.",
      intervalSaved: "Intervalo do poll: {minutes} min.",
      intervalFailed: "Falha ao salvar intervalo.",
      failed: "Falha ao salvar.",
    },
  },
  insights: {
    title: "Insights Instagram em lote",
    description:
      "Atualiza métricas dos posts já publicados ou monitorados. Opcionalmente filtra pela data de publicação (published_at).",
    publishedSince: "Publicado desde",
    publishedUntil: "Publicado até",
    rangeHintAll:
      "Sem datas: atualiza todos os posts published/monitored com mídia IG.",
    rangeHintWindow: "Janela por data de publicação (UTC): {parts}.",
    rangeFrom: "de {date}",
    rangeUntil: "até {date}",
    clearDates: "Limpar datas",
    connectInstagram: "Conecte o Instagram para atualizar insights.",
    refresh: "Atualizar insights",
    refreshing: "Atualizando…",
    toasts: {
      dateRangeInvalid: "A data inicial não pode ser depois da final.",
      completed:
        "Insights: {refreshed}/{requested} atualizados{failPart}{skipPart}.",
      failPart: " · {count} falha(s)",
      skipPart: " · {count} fora do limite",
      failed: "Falha ao atualizar insights.",
    },
  },
  meta: {
    toasts: {
      connectionFailed: "Falha na conexão.",
      messagingPermission:
        "Sem permissão para enviar mensagens. Reconecte o Instagram.",
      healthOk: "Conexão com a Meta OK (incluindo mensagens).",
      testFailed: "Falha ao testar conexão.",
      disconnected: "Instagram desconectado.",
      disconnectFailed: "Não foi possível desconectar o Instagram.",
    },
  },
  operatorNotifications: {
    title: "Alertas do operador",
    description:
      "Quando o agente DM usa notify_operator, você recebe um email com o contexto do caso.",
    help:
      "O agente informa ao cliente que o caso será verificado internamente. Ative o email para ser avisado automaticamente.",
    emailEnabled: "Enviar alertas por email",
    emailDestination: "Email do operador",
    emailPlaceholder: "voce@empresa.com",
    aiLockDays: "Retomar IA automaticamente após (dias)",
    aiLockDaysHelp:
      "Após escalação, a IA fica em silêncio nesta conversa até você destravar ou passar esse prazo (avaliado na próxima mensagem).",
    save: "Salvar",
    sendTest: "Enviar teste",
    toasts: {
      loadFailed: "Falha ao carregar alertas.",
      saved: "Alertas salvos.",
      saveFailed: "Falha ao salvar alertas.",
      testSent: "Email de teste enviado.",
      testFailed: "Falha ao enviar teste — verifique SMTP e destino.",
    },
  },
};
