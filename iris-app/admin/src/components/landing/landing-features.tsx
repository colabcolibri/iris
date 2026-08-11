import { Bot, LayoutGrid, Shield, Webhook } from "lucide-react";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Calendário e kanban",
    description:
      "Alterne entre visão mensal e quadro editorial para enxergar o que está rascunho, agendado ou publicado.",
  },
  {
    icon: Bot,
    title: "Agente de comentários",
    description:
      "Respostas sugeridas com harness editorial, simulador e trilha de auditoria para cada decisão.",
  },
  {
    icon: Shield,
    title: "Controle e privacidade",
    description:
      "Login por OTP, sessão segura e tokens criptografados. Você decide o que automatizar e o que aprovar.",
  },
  {
    icon: Webhook,
    title: "Integração Meta",
    description:
      "OAuth, webhooks e Graph API para manter comentários e publicações sincronizados com o Instagram.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="recursos" className="border-t border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-panel)]/50">
      <div className="mx-auto w-full min-w-0 max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--iris-lp-muted)] uppercase">
            02 · Recursos
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--iris-lp-text)] sm:text-4xl">
            Feito para quem publica com{" "}
            <span className="italic text-[color:var(--iris-lp-primary)]">intenção</span>
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="min-w-0 rounded-2xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-ink)] p-6 sm:p-8"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[color:var(--iris-lp-primary)]/15 text-[color:var(--iris-lp-primary)]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold text-[color:var(--iris-lp-text)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--iris-lp-text-soft)] sm:text-base">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
