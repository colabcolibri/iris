import type { AppLocale } from "@/i18n/types";
import { shellEn } from "@/i18n/domains/shell/en";
import { shellPt } from "@/i18n/domains/shell/pt";
import type { ShellMessages } from "@/i18n/domains/shell/types";
import { labelsEn } from "@/i18n/domains/labels/en";
import { labelsPt } from "@/i18n/domains/labels/pt";
import type { LabelsMessages } from "@/i18n/domains/labels/types";
import { serverErrorsEn } from "@/i18n/domains/server-errors/en";
import { serverErrorsPt } from "@/i18n/domains/server-errors/pt";
import type { ServerErrorsMessages } from "@/i18n/domains/server-errors/types";
import { postsEn } from "@/i18n/domains/posts/en";
import { postsPt } from "@/i18n/domains/posts/pt";
import type { PostsMessages } from "@/i18n/domains/posts/types";
import { commentsEn } from "@/i18n/domains/comments/en";
import { commentsPt } from "@/i18n/domains/comments/pt";
import type { CommentsMessages } from "@/i18n/domains/comments/types";
import { messagesEn } from "@/i18n/domains/messages/en";
import { messagesPt } from "@/i18n/domains/messages/pt";
import type { MessagesMessages } from "@/i18n/domains/messages/types";
import { webhooksEn } from "@/i18n/domains/webhooks/en";
import { webhooksPt } from "@/i18n/domains/webhooks/pt";
import type { WebhooksMessages } from "@/i18n/domains/webhooks/types";
import { settingsEn } from "@/i18n/domains/settings/en";
import { settingsPt } from "@/i18n/domains/settings/pt";
import type { SettingsMessages } from "@/i18n/domains/settings/types";
import { agentEn } from "@/i18n/domains/agent/en";
import { agentPt } from "@/i18n/domains/agent/pt";
import type { AgentMessages } from "@/i18n/domains/agent/types";
import { legalEn } from "@/i18n/domains/legal/en";
import { legalPt } from "@/i18n/domains/legal/pt";
import type { LegalMessages } from "@/i18n/domains/legal/types";
import { productsEn } from "@/i18n/domains/products/en";
import { productsPt } from "@/i18n/domains/products/pt";
import type { ProductsMessages } from "@/i18n/domains/products/types";

export type I18nDomainId =
  | "shell"
  | "labels"
  | "serverErrors"
  | "posts"
  | "comments"
  | "messages"
  | "webhooks"
  | "settings"
  | "agent"
  | "legal"
  | "products";

export type DomainMessagesMap = {
  shell: ShellMessages;
  labels: LabelsMessages;
  serverErrors: ServerErrorsMessages;
  posts: PostsMessages;
  comments: CommentsMessages;
  messages: MessagesMessages;
  webhooks: WebhooksMessages;
  settings: SettingsMessages;
  agent: AgentMessages;
  legal: LegalMessages;
  products: ProductsMessages;
};

const PT_DOMAINS: DomainMessagesMap = {
  shell: shellPt,
  labels: labelsPt,
  serverErrors: serverErrorsPt,
  posts: postsPt,
  comments: commentsPt,
  messages: messagesPt,
  webhooks: webhooksPt,
  settings: settingsPt,
  agent: agentPt,
  legal: legalPt,
  products: productsPt,
};

const EN_DOMAINS: DomainMessagesMap = {
  shell: shellEn,
  labels: labelsEn,
  serverErrors: serverErrorsEn,
  posts: postsEn,
  comments: commentsEn,
  messages: messagesEn,
  webhooks: webhooksEn,
  settings: settingsEn,
  agent: agentEn,
  legal: legalEn,
  products: productsEn,
};

export function getDomainMessages<D extends I18nDomainId>(
  domain: D,
  locale: AppLocale,
): DomainMessagesMap[D] {
  const table = locale === "en" ? EN_DOMAINS : PT_DOMAINS;
  return table[domain];
}

export function getAllDomainMessages(locale: AppLocale): DomainMessagesMap {
  return locale === "en" ? EN_DOMAINS : PT_DOMAINS;
}

export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? `{${key}}`),
  );
}
