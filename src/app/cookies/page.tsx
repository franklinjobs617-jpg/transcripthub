import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Cookie Policy - Transcripthub",
  description:
    "Understand how Transcripthub uses cookies for sessions, analytics, and security controls.",
  keywords: [
    "cookie policy transcripthub",
    "session cookies",
    "analytics cookies",
    "cookie management",
  ],
  alternates: {
    canonical: "/cookies",
  },
};

export default function CookiesPage() {
  const cookieTypes = [
    {
      type: "Essential Cookies",
      purpose: "Keep login sessions active, secure requests, and maintain core site functionality.",
      duration: "Session to short-term",
    },
    {
      type: "Preference Cookies",
      purpose: "Remember user preferences such as theme mode and selected UI behavior.",
      duration: "Short to medium term",
    },
    {
      type: "Analytics Cookies",
      purpose: "Measure feature usage and performance trends to improve product decisions.",
      duration: "Medium term",
    },
    {
      type: "Security Cookies",
      purpose: "Support abuse controls, suspicious traffic handling, and integrity checks.",
      duration: "Short term",
    },
  ];

  return (
    <PageShell
      eyebrow="Legal"
      title="Cookie Policy"
      description="Cookies help maintain secure sessions, preference settings, and service analytics."
      primaryCta={{ href: "/privacy", label: "Open Privacy Policy" }}
      secondaryCta={{ href: "/contact", label: "Cookie Questions" }}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { k: "Cookie Types", v: "Essential, preference, analytics, security" },
          { k: "Control", v: "Managed via browser settings" },
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {cookieTypes.map((item) => (
          <article key={item.type} className="ui-card bg-app-surface p-5">
            <h2 className="text-base font-bold text-app-text">{item.type}</h2>
            <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{item.purpose}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
              Typical Duration: {item.duration}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 ui-card bg-app-surface p-6 sm:p-8">
        <div className="space-y-6 text-sm leading-relaxed text-app-text-muted">
          <section>
            <h2 className="text-base font-bold text-app-text">How to Manage Cookies</h2>
            <p className="mt-2">
              You can disable or remove cookies in browser settings. Blocking essential cookies may
              impact login and core functionality.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-app-text">Cross-Border Processing</h2>
            <p className="mt-2">
              Depending on provider infrastructure, cookie-related data may be processed in
              different regions under applicable legal safeguards.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-app-text">Contact for Cookie Requests</h2>
            <p className="mt-2">
              If you have cookie policy concerns, contact support and include your browser details
              and account email when relevant.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
