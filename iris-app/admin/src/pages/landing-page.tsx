import { LandingContact } from "@/components/landing/landing-contact";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingTrust } from "@/components/landing/landing-trust";
import { LandingWorkflow } from "@/components/landing/landing-workflow";
import { LandingI18nProvider } from "@/i18n/landing-context";
import "@/landing.css";

function LandingPageContent() {
  return (
    <div className="iris-landing">
      <LandingNav />
      <main className="relative w-full min-w-0 overflow-x-clip">
        <LandingHero />
        <LandingWorkflow />
        <LandingFeatures />
        <LandingTrust />
        <LandingPricing />
        <LandingFaq />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}

export function LandingPage() {
  return (
    <LandingI18nProvider>
      <LandingPageContent />
    </LandingI18nProvider>
  );
}
