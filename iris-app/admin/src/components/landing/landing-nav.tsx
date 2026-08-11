import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#faq", label: "FAQ" },
  { href: "#contato", label: "Contato" },
] as const;

type LandingNavProps = {
  className?: string;
};

export function LandingNav({ className }: LandingNavProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-ink)]/95 backdrop-blur-lg",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.home} className="flex shrink-0 items-center gap-3 text-foreground no-underline">
          <BrandLogo size="sm" />
          <span className="font-display text-lg font-semibold tracking-tight text-[color:var(--iris-lp-text)]">
            Iris
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[color:var(--iris-lp-muted)] transition-colors hover:text-[color:var(--iris-lp-text)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#contato"
            className="hidden text-sm font-medium text-[color:var(--iris-lp-muted)] transition-colors hover:text-[color:var(--iris-lp-text)] sm:inline"
          >
            Fale comigo
          </a>
          <Link
            to={ROUTES.admin.login}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[color:var(--iris-lp-primary)] px-4 text-sm font-medium text-[color:var(--iris-lp-on-primary)] transition-opacity hover:opacity-90"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
