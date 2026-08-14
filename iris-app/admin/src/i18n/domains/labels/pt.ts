import type { LabelsMessages } from "@/i18n/domains/labels/types";

export const labelsPt = {
  postStatus: {
    draft: "Rascunho",
    scheduled: "Agendado",
    published: "Publicado",
    monitored: "Monitorado",
    failed: "Falhou",
    cancelled: "Cancelado",
  },
  kanbanColumns: {
    draft: "Rascunho",
    scheduled: "Agendado",
    published: "Publicado",
    failed: "Falhou",
    cancelled: "Cancelado",
  },
  kanbanActions: {
    cancelPost: "Cancelar postagem",
    unschedule: "Desagendar (voltar a rascunho)",
    backToDraft: "Voltar a rascunho",
    restoreDraft: "Restaurar como rascunho",
    purgePermanent: "Deletar permanentemente",
  },
  commentStatus: {
    pending: "Aguardando resposta",
    replied: "Respondido",
    skipped: "Ignorado",
    failed: "Falha",
    removedOnIg: "Removido no IG",
    awaitingApproval: "Aguardando aprovação",
  },
  commentHints: {
    removedOnIg:
      "Este comentário não aparece mais no Instagram. Sincronize o post para atualizar.",
    pendingDraft:
      "A Iris gerou um rascunho — revise e aprove para publicar no Instagram.",
    pending: "Comentário recebido; a Iris ainda não publicou resposta neste thread.",
    failed:
      "A resposta automática falhou. Tente sincronizar ou responder manualmente.",
    skipped: "Este comentário foi ignorado pela automação.",
    brandComment: "Comentário da marca (não requer resposta da Iris).",
  },
  replyModeGlobal: {
    off: {
      label: "Desligado",
      description:
        "A Iris não responde comentários em nenhum post que siga o global.",
    },
    auto: {
      label: "Automático",
      description: "A Iris responde e publica no Instagram sem revisão.",
    },
    draft: {
      label: "Com aprovação",
      description:
        "A Iris sugere a resposta; você revisa e aprova antes de publicar.",
    },
  },
  replyModePost: {
    inherit: {
      label: "Seguir global",
      description:
        "Usa o modo definido nas configurações do agente de comentários.",
    },
    off: {
      label: "Pausar nesta publicação",
      description:
        "A Iris não responde comentários desta publicação (o modo global continua igual).",
    },
    auto: {
      label: "Automático",
      description: "A Iris responde e publica no Instagram sem revisão.",
    },
    draft: {
      label: "Com aprovação",
      description:
        "A Iris sugere a resposta; você revisa e aprova antes de publicar.",
    },
  },
  audit: {
    stages: {
      triage: "Triagem",
      draft: "Rascunho",
      verify: "Verificação",
      message_triage: "Triagem DM",
      message_draft: "Rascunho DM",
      message_draft_turn: "Turno do draft DM",
      tool_call: "Tool",
      tool_result: "Resultado da tool",
      message_verify: "Verificação DM",
    },
    verdicts: {
      pass: "Aprovado",
      fail: "Reprovado",
      skip: "Ignorado",
    },
  },
} satisfies LabelsMessages;
