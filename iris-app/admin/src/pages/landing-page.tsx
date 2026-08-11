import { LandingContact } from "@/components/landing/landing-contact";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingWorkflow } from "@/components/landing/landing-workflow";
import "@/landing.css";

export function LandingPage() {
  return (
    <div className="iris-landing">
      <LandingNav />
      <main className="relative w-full min-w-0 overflow-x-clip">
        <LandingHero />
        <LandingWorkflow />
        <LandingFeatures />
        <LandingFaq />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}
