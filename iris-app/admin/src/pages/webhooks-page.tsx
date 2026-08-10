import { PageContainer } from "@/components/templates/page-container";
import { WebhookEventsCard } from "@/components/settings/webhook-events-card";

export function WebhooksPage() {
  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header
          eyebrow="Operação"
          title="Webhooks"
          description="Eventos recebidos da Meta em tempo real. Use para verificar se comentários foram processados, ignorados ou falharam."
        />

        <WebhookEventsCard />
      </PageContainer.Content>
    </PageContainer>
  );
}
