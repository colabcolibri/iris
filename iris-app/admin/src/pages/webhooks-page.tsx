import { PageContainer } from "@/components/templates/page-container";
import { WebhookEventsPanel } from "@/components/settings/webhook-events-card";
import { useDomainMessages } from "@/i18n/provider";

export function WebhooksPage() {
  const webhooks = useDomainMessages("webhooks");

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-4 sm:px-6 md:px-8">
            <PageContainer.Header
              eyebrow={webhooks.page.eyebrow}
              title={webhooks.page.title}
              description={webhooks.page.description}
            />
          </div>
          <WebhookEventsPanel />
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
