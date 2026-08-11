import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ROUTES } from "@/lib/routes";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-panel)]/60">
      <div className="mx-auto flex w-full min-w-0 max-w-[1200px] flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Link to={ROUTES.home} className="flex items-center gap-3 text-foreground no-underline">
            <BrandLogo size="sm" />
            <span className="font-display text-lg font-semibold tracking-tight text-[color:var(--iris-lp-text)]">
              Iris
            </span>
          </Link>
          <p className="max-w-md text-sm leading-relaxed text-[color:var(--iris-lp-text-soft)]">
            Plataforma editorial para Instagram — agendamento, publicação, comentários e respostas
            com contexto.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <a
            href="#contato"
            className="text-[color:var(--iris-lp-text-soft)] transition-colors hover:text-[color:var(--iris-lp-primary)]"
          >
            Contato
          </a>
          <Link
            to={ROUTES.privacy}
            className="text-[color:var(--iris-lp-text-soft)] transition-colors hover:text-[color:var(--iris-lp-primary)]"
          >
            Privacidade
          </Link>
          <Link
            to={ROUTES.admin.login}
            className="text-[color:var(--iris-lp-text-soft)] transition-colors hover:text-[color:var(--iris-lp-primary)]"
          >
            Entrar no painel
          </Link>
        </div>
      </div>

      <div className="border-t border-[color:var(--iris-lp-rule)]">
        <div className="mx-auto flex w-full min-w-0 max-w-[1200px] flex-col gap-2 px-4 py-5 text-xs text-[color:var(--iris-lp-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {year} Iris · Sergio Luciano</span>
          <span>iris.sergioluciano.com</span>
        </div>
      </div>
    </footer>
  );
}
