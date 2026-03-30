import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy - Transcripthub",
  description:
    "Read how Transcripthub handles account data, transcription requests, and privacy safeguards.",
  keywords: [
    "transcripthub privacy policy",
    "ai transcript privacy",
    "data retention policy",
    "user data rights",
  ],
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  const policySections = [
    {
      title: "1. Data We Collect",
      body: "We process account identifiers, plan status, submitted video URLs, and transcript generation activity required to deliver product functions and support operations.",
    },
    {
      title: "2. Why We Process Data",
      body: "Data is used for request validation, transcript generation, abuse prevention, troubleshooting, and service quality improvements.",
    },
    {
      title: "3. Legal Basis",
      body: "We process data to perform the service contract, maintain security and fraud controls, and comply with legal and accounting obligations.",
    },
    {
      title: "4. Security Controls",
      body: "We apply access controls, transport security, and provider-level safeguards to reduce unauthorized access and protect operational infrastructure.",
    },
    {
      title: "5. Retention",
      body: "We retain data only as needed for service operation, billing records, and legal obligations. Retention periods may vary by data type and jurisdiction.",
    },
    {
      title: "6. Third-Party Providers",
      body: "Authentication, payment, and infrastructure providers may process limited data required to complete their respective services.",
    },
    {
      title: "7. Your Rights",
      body: "You can request access, correction, deletion, and account-level data inquiries by contacting support using your registered email.",
    },
    {
      title: "8. Policy Updates",
      body: "We may update this policy when product scope, law, or provider requirements change. Material updates are reflected on this page.",
    },
  ];

  const privacyFaq = [
    {
      q: "Do you sell user data?",
      a: "No. We do not sell personal account data.",
    },
    {
      q: "Can I request data deletion?",
      a: "Yes. Submit a deletion request through the contact page with account verification details.",
    },
    {
      q: "Where can I manage billing privacy concerns?",
      a: "Billing-related questions can be sent to support and reviewed with account verification.",
    },
  ];

  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="This page explains what data we process, why we process it, and how users can request updates or deletion."
      primaryCta={{ href: "/contact", label: "Contact Privacy Team" }}
      secondaryCta={{ href: "/terms", label: "Read Terms of Service" }}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { k: "Scope", v: "Account, usage, and billing data" },
          { k: "Control", v: "User request and verification workflow" },
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
          {policySections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-app-text">{section.title}</h2>
              <p className="mt-2">{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-5 ui-card bg-app-surface p-6">
        <h2 className="text-lg font-bold text-app-text">Privacy FAQ</h2>
        <div className="mt-4 space-y-3">
          {privacyFaq.map((faq) => (
            <details key={faq.q} className="rounded-lg border border-app-border bg-app-bg px-4 py-3">
              <summary className="cursor-pointer text-sm font-bold text-app-text">{faq.q}</summary>
              <p className="mt-2 text-sm text-app-text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
