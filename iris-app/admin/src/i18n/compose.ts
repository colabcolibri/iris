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
import { settingsEn } from "@/i18n/domains/settings/en";
import { settingsPt } from "@/i18n/domains/settings/pt";
import type { SettingsMessages } from "@/i18n/domains/settings/types";
import { agentEn } from "@/i18n/domains/agent/en";
import { agentPt } from "@/i18n/domains/agent/pt";
import type { AgentMessages } from "@/i18n/domains/agent/types";
import { productsEn } from "@/i18n/domains/products/en";
import { productsPt } from "@/i18n/domains/products/pt";
import type { ProductsMessages } from "@/i18n/domains/products/types";
import { webhooksEn } from "@/i18n/domains/webhooks/en";
import { webhooksPt } from "@/i18n/domains/webhooks/pt";
import type { WebhooksMessages } from "@/i18n/domains/webhooks/types";
import { legalEn } from "@/i18n/domains/legal/en";
import { legalPt } from "@/i18n/domains/legal/pt";
import type { LegalMessages } from "@/i18n/domains/legal/types";
import { marketingEn } from "@/i18n/domains/marketing/en";
import { marketingPt } from "@/i18n/domains/marketing/pt";
import type { MarketingMessages } from "@/i18n/domains/marketing/types";

export type I18nDomainId =
  | "shell"
  | "labels"
  | "posts"
  | "comments"
  | "messages"
  | "settings"
  | "agent"
  | "products"
  | "webhooks"
  | "legal"
  | "marketing"
  | "serverErrors";

export type DomainMessagesMap = {
  shell: ShellMessages;
  labels: LabelsMessages;
  posts: PostsMessages;
  comments: CommentsMessages;
  messages: MessagesMessages;
  settings: SettingsMessages;
  agent: AgentMessages;
  products: ProductsMessages;
  webhooks: WebhooksMessages;
  legal: LegalMessages;
  marketing: MarketingMessages;
  serverErrors: ServerErrorsMessages;
};

const PT_DOMAINS: DomainMessagesMap = {
  shell: shellPt,
  labels: labelsPt,
  posts: postsPt,
  comments: commentsPt,
  messages: messagesPt,
  settings: settingsPt,
  agent: agentPt,
  products: productsPt,
  webhooks: webhooksPt,
  legal: legalPt,
  marketing: marketingPt,
  serverErrors: serverErrorsPt,
};

const EN_DOMAINS: DomainMessagesMap = {
  shell: shellEn,
  labels: labelsEn,
  posts: postsEn,
  comments: commentsEn,
  messages: messagesEn,
  settings: settingsEn,
  agent: agentEn,
  products: productsEn,
  webhooks: webhooksEn,
  legal: legalEn,
  marketing: marketingEn,
  serverErrors: serverErrorsEn,
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
