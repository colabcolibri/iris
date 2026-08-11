import { CalendarDays, MessageCircle, Sparkles, Upload } from "lucide-react";

const STEPS = [
  {
    icon: CalendarDays,
    title: "Planeje",
    description:
      "Organize o calendário editorial com kanban ou visão mensal. Legendas, mídia e horários em um fluxo só.",
  },
  {
    icon: Upload,
    title: "Publique",
    description:
      "Agende e publique direto na sua conta Instagram via API oficial da Meta — sem gambiarras.",
  },
  {
    icon: MessageCircle,
    title: "Acompanhe",
    description:
      "Comentários chegam em tempo real. Você vê contexto, histórico e status de cada interação.",
  },
  {
    icon: Sparkles,
    title: "Responda com contexto",
    description:
      "Sugestões de resposta alinhadas à sua persona editorial, com aprovação humana antes de enviar.",
  },
] as const;

export function LandingWorkflow() {
  return (
    <section id="como-funciona" className="border-t border-[color:var(--iris-lp-rule)]">
      <div className="mx-auto w-full min-w-0 max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--iris-lp-muted)] uppercase">
            01 · Como funciona
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--iris-lp-text)] sm:text-4xl">
            Do planejamento à resposta,{" "}
            <span className="italic text-[color:var(--iris-lp-primary)]">sem perder o fio</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[color:var(--iris-lp-text-soft)] sm:text-lg">
            O Iris conecta publicação, moderação e resposta em um painel pensado para quem cuida de
            presença no Instagram com critério editorial.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-panel)] p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm text-[color:var(--iris-lp-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[color:var(--iris-lp-primary)]/15 text-[color:var(--iris-lp-primary)]">
                    <Icon className="size-4" />
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-[color:var(--iris-lp-text)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--iris-lp-text-soft)]">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
