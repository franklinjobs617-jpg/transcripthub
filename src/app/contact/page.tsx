import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Contact Transcripthub Support",
  description:
    "Contact Transcripthub for support, billing questions, transcript issues, and enterprise requests.",
  keywords: ["contact transcripthub", "transcript support", "billing support"],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const supportTopics = [
    {
      title: "Transcript Errors",
      desc: "Include platform URL, error code, and time when the issue occurred.",
    },
    {
      title: "Billing and Credits",
      desc: "Include account email and payment receipt or order reference when possible.",
    },
    {
      title: "Account Access",
      desc: "Describe sign-in issue and include browser/device details to speed up triage.",
    },
    {
      title: "Enterprise Requests",
      desc: "Share expected monthly volume, platforms, and export format requirements.",
    },
  ];

  const contactFaq = [
    {
      q: "How fast do you usually reply?",
      a: "Most requests are answered within one business day.",
    },
    {
      q: "Where do I report failed transcript jobs?",
      a: "Use support email and include the exact URL and error details shown on screen.",
    },
    {
      q: "Can I request account-level data changes?",
      a: "Yes, include your registered account email for verification.",
    },
  ];

  return (
    <PageShell
      eyebrow="Support"
      title="Contact support for transcript, billing, and account issues"
      description="Send your question with the related video URL or job context so we can respond faster."
      primaryCta={{ href: "mailto:support@transcripthub.com", label: "Email Support" }}
      secondaryCta={{ href: "/pricing", label: "View Plans" }}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <article className="ui-card bg-app-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-app-text">
            <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Email
          </h2>
          <p className="mt-2 text-sm text-app-text-muted">support@transcripthub.com</p>
        </article>
        <article className="ui-card bg-app-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-app-text">
            <MessageSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Typical Response
          </h2>
          <p className="mt-2 text-sm text-app-text-muted">Usually within one business day.</p>
        </article>
        <article className="ui-card bg-app-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-app-text">
            <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Privacy Requests
          </h2>
          <p className="mt-2 text-sm text-app-text-muted">Include account email for verification.</p>
        </article>
      </div>

      <div className="mt-5 ui-card bg-app-surface p-6">
        <h2 className="text-lg font-bold text-app-text">Before contacting support</h2>
        <ul className="mt-3 space-y-2 text-sm text-app-text-muted">
          <li>1. Include the video URL and platform.</li>
          <li>2. Include the exact error message shown on screen.</li>
          <li>3. Include your account email for billing or entitlement issues.</li>
        </ul>
        <div className="mt-4">
          <Link href="/terms" className="ui-link-arrow text-sm font-bold">
            <span>Read Service Terms</span>
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {supportTopics.map((topic) => (
          <article key={topic.title} className="ui-card bg-app-surface p-5">
            <h2 className="text-base font-bold text-app-text">{topic.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{topic.desc}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 ui-card bg-app-surface p-6">
        <h2 className="text-lg font-bold text-app-text">Support FAQ</h2>
        <div className="mt-4 space-y-3">
          {contactFaq.map((faq) => (
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
