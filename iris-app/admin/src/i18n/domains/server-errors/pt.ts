import type { ServerErrorsMessages } from "@/i18n/domains/server-errors/types";

export const serverErrorsPt = {
  LEGACY_MESSAGE: "{message}",
  VALIDATION_FAILED: "Dados inválidos. Verifique os campos e tente novamente.",
  META_NOT_CONNECTED: "Conecte sua conta do Instagram nas configurações.",
  META_TOKEN_EXPIRED: "Token do Instagram expirado. Reconecte sua conta.",
  META_NO_IG_USER: "Conta Instagram não configurada. Conecte nas configurações.",
  PUBLISH_NOT_CONFIGURED: "Publicação não configurada. Verifique a conexão Meta.",
  RATE_LIMITED: "Limite de requisições atingido. Tente novamente em instantes.",
  MESSAGING_WINDOW_EXPIRED:
    "A janela de 24h da Meta expirou. Só é possível responder dentro desse prazo após a última mensagem do cliente.",
  META_SEND_FAILED: "A Meta recusou o envio: {message}",
  META_PERMISSION_DENIED:
    "Sem permissão para enviar mensagens. Reconecte o Instagram e autorize mensagens ({message}).",
  CONTACT_INVALID: "Preencha todos os campos do formulário corretamente.",
  REQUEST_FAILED: "Falha na requisição ({status}).",
  INTERNAL_ERROR: "Erro interno. Tente novamente.",
  UNAUTHORIZED: "Sessão expirada. Entre novamente.",
  BODY_TOO_LARGE: "Conteúdo enviado é grande demais.",
} satisfies ServerErrorsMessages;
