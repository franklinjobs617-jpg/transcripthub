import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Terms of Service - Transcripthub",
  description:
    "Review Transcripthub terms, acceptable use, payment terms, and service limitations.",
  keywords: [
    "transcripthub terms",
    "terms of service transcript tool",
    "subscription terms",
    "acceptable use policy",
  ],
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  const termsSections = [
    {
      title: "1. Acceptance of Terms",
      body: "By using the website and services, you agree to these terms and all applicable policies referenced from this page.",
    },
    {
      title: "2. Service Description",
      body: "Transcripthub provides transcript generation and export workflows for supported social video links, subject to platform availability and technical constraints.",
    },
    {
      title: "3. User Responsibilities",
      body: "Users are responsible for lawful use of submitted content and must comply with platform rules, copyright obligations, and local regulations.",
    },
    {
      title: "4. Acceptable Use Restrictions",
      body: "Automated abuse, fraud, service disruption, unauthorized scraping, or attempts to bypass usage controls are prohibited.",
    },
    {
      title: "5. Subscription and Credits",
      body: "Paid plans, credits, and feature limits follow published pricing details and may be updated with prior notice where required.",
    },
    {
      title: "6. Payments and Renewals",
      body: "Recurring plans renew according to your selected billing cycle unless canceled before renewal. Payment processing is handled by external providers.",
    },
    {
      title: "7. Service Availability",
      body: "We strive for reliability but cannot guarantee uninterrupted access due to third-party platform changes, maintenance, or infrastructure events.",
    },
    {
      title: "8. Intellectual Property",
      body: "The service interface, branding, and software are protected assets. Third-party trademarks remain owned by their respective owners.",
    },
    {
      title: "9. Warranty and Liability",
      body: "Service is provided as-is within applicable law. Liability is limited to the amount paid during the relevant billing period.",
    },
    {
      title: "10. Updates and Termination",
      body: "Terms may be updated as product and legal requirements evolve. Continued use after updates indicates acceptance of revised terms.",
    },
  ];

  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="By using Transcripthub, you agree to these terms for service usage, subscriptions, and acceptable content."
      primaryCta={{ href: "/pricing", label: "View Pricing Plans" }}
      secondaryCta={{ href: "/privacy", label: "Read Privacy Policy" }}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { k: "Plan Terms", v: "Monthly, yearly, and credit usage rules" },
          { k: "User Duty", v: "Lawful content and compliant usage" },
          { k: "Last Updated", v: "2026-03-29" },
        ].map((item) => (
          <article key={item.k} className="ui-card bg-app-surface p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-app-text-muted">
              {item.k}
            </p>
            <p className="mt-2 text-sm font-semibold text-app-text">{item.v}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 ui-card bg-app-surface p-6 sm:p-8">
        <div className="space-y-6 text-sm leading-relaxed text-app-text-muted">
          {termsSections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-app-text">{section.title}</h2>
              <p className="mt-2">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
