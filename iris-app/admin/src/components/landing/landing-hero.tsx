import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
      <div className="mx-auto grid w-full min-w-0 max-w-[1200px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-8">
        <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[color:var(--iris-lp-primary)]" />
            <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--iris-lp-muted)] uppercase">
              Gestão editorial no Instagram
            </p>
          </div>

          <h1 className="font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-[color:var(--iris-lp-text)] sm:text-5xl lg:text-[3.25rem]">
            Seu Instagram com{" "}
            <span className="italic text-[color:var(--iris-lp-primary)]">ritmo editorial</span>{" "}
            e respostas inteligentes
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[color:var(--iris-lp-text-soft)] sm:text-lg">
            O Iris é uma plataforma para agendar publicações, acompanhar comentários e responder com
            contexto — usando a API oficial da Meta e uma persona editorial que você controla.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#contato"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[color:var(--iris-lp-primary)] px-6 text-sm font-medium text-[color:var(--iris-lp-on-primary)] transition-opacity hover:opacity-90"
            >
              Quero saber mais
            </a>
            <Link
              to={ROUTES.admin.login}
              className="inline-flex h-11 items-center justify-center rounded-md border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-panel)] px-6 text-sm font-medium text-[color:var(--iris-lp-text)] transition-colors hover:border-[color:var(--iris-lp-primary)]"
            >
              Acessar o painel
            </Link>
          </div>
        </div>

        <div
          aria-hidden
          className="relative hidden min-h-[360px] rounded-2xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-panel)] p-6 shadow-[0_24px_60px_-24px_rgba(26,24,20,0.35)] lg:block"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-ink)] p-4">
              <p className="text-xs font-medium tracking-wide text-[color:var(--iris-lp-muted)] uppercase">
                Calendário editorial
              </p>
              <p className="mt-2 font-display text-lg text-[color:var(--iris-lp-text)]">
                Posts agendados, legendas e status em um só lugar
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-ink)] p-4">
              <p className="text-xs font-medium tracking-wide text-[color:var(--iris-lp-muted)] uppercase">
                Inbox de comentários
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--iris-lp-text-soft)]">
                Triagem, respostas sugeridas e aprovação antes de publicar na Meta.
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-ink)] p-4">
              <p className="text-xs font-medium tracking-wide text-[color:var(--iris-lp-muted)] uppercase">
                Persona editorial
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--iris-lp-text-soft)]">
                Tom de voz, limites e contexto que guiam cada resposta assistida.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
