export const webhooksPt = {
  page: {
    eyebrow: "Operação",
    title: "Webhooks",
    description:
      "Eventos recebidos da Meta em tempo real. Use para verificar se comentários foram processados, ignorados ou falharam.",
    backToAll: "Todos os eventos",
    list: "Lista",
    sheetTitle: "Eventos",
    loading: "Carregando eventos…",
    loadingEvent: "Carregando evento…",
    loadingShort: "Carregando…",
    eventNotFound:
      "Evento não encontrado na lista atual (filtros podem estar ocultando).",
  },
  filters: {
    statusLabel: "Status",
    typeLabel: "Tipo",
    all: "todos",
    commentsOnly: "comentários",
    invalidSignatureOnly: "só assinatura inválida",
    exportLast: "Exportar últimos",
    exportJson: "Exportar JSON",
    refresh: "Atualizar",
  },
  status: {
    received: "recebido",
    processed: "processado",
    ignored: "ignorado",
    failed: "falhou",
    invalidSignature: "assinatura inválida",
  },
  verb: {
    add: "novo",
    edited: "editado",
    removed: "removido",
  },
  table: {
    received: "Recebido",
    type: "Tipo",
    status: "Status",
    authorSummary: "Autor / resumo",
    post: "Post",
    comment: "Comentário",
    mediaPrefix: "mídia",
    igPrefix: "ig",
    empty: "—",
  },
  empty: {
    title: "Nenhum webhook",
    body: "Nenhum evento encontrado com os filtros atuais.",
    sheetBody: "Nenhum evento com os filtros atuais.",
  },
  detail: {
    post: "Post",
    comment: "Comentário",
    author: "Autor",
    entries: "Entradas",
    payload: "Payload",
    payloadTruncated:
      "\n… (truncado na listagem — use exportar para o JSON completo)",
  },
  toasts: {
    loadFailed: "Falha ao carregar webhooks.",
    exported: "Exportados os últimos {count} webhooks.",
    exportFailed: "Falha ao exportar webhooks.",
  },
};
