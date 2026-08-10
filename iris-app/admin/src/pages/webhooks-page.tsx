import { WebhookEventsCard } from "@/components/settings/webhook-events-card";

export function WebhooksPage() {
  return (
    <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Operação
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Eventos recebidos da Meta em tempo real. Use para verificar se comentários foram
            processados, ignorados ou falharam.
          </p>
        </header>

        <WebhookEventsCard />
      </div>
    </div>
  );
}
