export function messagesHref(options: {
  conversationId?: string | null;
  messageId?: string | null;
  basePath: string;
}): string {
  const params = new URLSearchParams();
  if (options.conversationId) {
    params.set("conversation_id", options.conversationId);
  }
  if (options.messageId) {
    params.set("message_id", options.messageId);
  }
  const query = params.toString();
  return query ? `${options.basePath}?${query}` : options.basePath;
}
