import { PageContainer } from "@/components/templates/page-container";
import { WebhookEventsPanel } from "@/components/settings/webhook-events-card";

export function WebhooksPage() {
  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
          <PageContainer.Header
            eyebrow="Operação"
            title="Webhooks"
            description="Eventos recebidos da Meta em tempo real. Use para verificar se comentários foram processados, ignorados ou falharam."
          />
        </div>
        <WebhookEventsPanel />
      </PageContainer.Content>
    </PageContainer>
  );
}
