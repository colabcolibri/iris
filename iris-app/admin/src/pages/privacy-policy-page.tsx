import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { interpolate } from "@/i18n/compose";
import { useDomainMessages } from "@/i18n/provider";
import { ROUTES } from "@/lib/routes";

export function PrivacyPolicyPage() {
  const legal = useDomainMessages("legal").privacy;

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/80 bg-card/50 px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <Link
            to={ROUTES.home}
            className="flex items-center gap-3 text-foreground no-underline"
          >
            <BrandLogo size="sm" />
            <span className="font-display text-xl font-semibold tracking-tight">
              Iris
            </span>
          </Link>
          <Link
            to={ROUTES.admin.login}
            className="text-sm font-medium text-primary hover:underline"
          >
            {legal.header.signIn}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <article className="space-y-8 text-foreground">
          <header className="space-y-2">
            <h1 className="font-display text-xl font-semibold tracking-tight">
              {legal.page.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {legal.page.lastUpdatedLabel} {legal.meta.lastUpdated}
            </p>
          </header>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>{legal.intro.p1}</p>
            <p>{legal.intro.p2}</p>
          </section>

          <PolicySection title={legal.sections.dataCollected.title}>
            <ul className="list-disc space-y-2 pl-5">
              {Object.values(legal.sections.dataCollected.items).map((item) => (
                <li key={item.label}>
                  <strong className="font-medium text-foreground">{item.label}</strong>{" "}
                  {item.body}
                </li>
              ))}
            </ul>
          </PolicySection>

          <PolicySection title={legal.sections.dataUse.title}>
            <ul className="list-disc space-y-2 pl-5">
              {legal.sections.dataUse.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </PolicySection>

          <PolicySection title={legal.sections.legalBasis.title}>
            <p>{legal.sections.legalBasis.body}</p>
          </PolicySection>

          <PolicySection title={legal.sections.sharing.title}>
            <p>{legal.sections.sharing.intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {Object.values(legal.sections.sharing.items).map((item) => (
                <li key={item.label}>
                  <strong className="font-medium text-foreground">{item.label}</strong>{" "}
                  {item.body}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              {legal.sections.sharing.metaPolicyPrefix}{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                className="text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {legal.sections.sharing.metaPolicyLink}
              </a>
              {legal.sections.sharing.metaPolicySuffix}
            </p>
          </PolicySection>

          <PolicySection title={legal.sections.retention.title}>
            <p>{legal.sections.retention.body}</p>
          </PolicySection>

          <PolicySection title={legal.sections.security.title}>
            <p>{legal.sections.security.body}</p>
          </PolicySection>

          <PolicySection title={legal.sections.rights.title}>
            <p>{legal.sections.rights.p1}</p>
            <p className="mt-3">{legal.sections.rights.p2}</p>
          </PolicySection>

          <PolicySection title={legal.sections.changes.title}>
            <p>{legal.sections.changes.body}</p>
          </PolicySection>

          <section className="rounded-xl border border-border/80 bg-card/60 p-6 text-sm text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">
                {legal.disclaimer.label}
              </strong>{" "}
              {legal.disclaimer.body}
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        <p>
          {interpolate(legal.footer.copyright, {
            year: new Date().getFullYear(),
          })}
        </p>
      </footer>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}
